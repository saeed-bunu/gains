import webpush from 'npm:web-push@3.6.7'
import { createClient } from 'npm:@supabase/supabase-js@2'

type PushSubscriptionRow = {
  id: number
  endpoint: string
  p256dh: string
  auth_key: string
}

const beforeQuotes = [
  'The only bad workout is the one that didn’t happen.',
  'You don’t have to be extreme, just consistent.',
  'The secret of getting ahead is getting started.',
]
const missedQuotes = [
  'Never miss two days in a row. Tomorrow is a fresh chance to show up for yourself.',
  'One missed session doesn’t erase your progress. Reset and keep going.',
  'Consistency is coming back, one workout at a time.',
]

function requiredEnv(name: string) {
  const value = Deno.env.get(name)
  if (!value) throw new Error(`Missing required environment variable: ${name}`)
  return value
}

function randomQuote(items: string[]) {
  return items[Math.floor(Math.random() * items.length)]
}

function statusCode(error: unknown) {
  if (typeof error === 'object' && error !== null && 'statusCode' in error) {
    return Number(error.statusCode)
  }
  return 0
}

function isAllowedPushEndpoint(endpoint: string) {
  try {
    const url = new URL(endpoint)
    return url.protocol === 'https:' && (
      url.hostname === 'fcm.googleapis.com' ||
      url.hostname.endsWith('.push.services.mozilla.com') ||
      url.hostname === 'push.apple.com' ||
      url.hostname.endsWith('.push.apple.com') ||
      url.hostname.endsWith('.notify.windows.com') ||
      url.hostname.endsWith('.push.samsung.com')
    )
  } catch {
    return false
  }
}

Deno.serve(async (request) => {
  if (request.method !== 'POST') return new Response('Method not allowed', { status: 405 })

  try {
    const schedulerSecret = requiredEnv('GYM_REMINDER_CRON_SECRET')
    if (request.headers.get('authorization') !== `Bearer ${schedulerSecret}`) {
      return new Response('Unauthorized', { status: 401 })
    }

    const supabaseUrl = requiredEnv('SUPABASE_URL')
    const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ??
      JSON.parse(requiredEnv('SUPABASE_SECRET_KEYS')).default
    const admin = createClient(supabaseUrl, serviceKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    })

    webpush.setVapidDetails(
      requiredEnv('VAPID_SUBJECT'),
      requiredEnv('VAPID_PUBLIC_KEY'),
      requiredEnv('VAPID_PRIVATE_KEY'),
    )

    // 1. Fetch ONLY the jobs that are due right now
    const { data: jobs, error: jobsError } = await admin
      .from('gym_reminder_jobs')
      .select('*')
      .lte('scheduled_at', new Date().toISOString())
      
    if (jobsError) throw jobsError

    let sent = 0
    let failures = 0

    // 2. Loop through the queue
    for (const job of jobs ?? []) {
      try {
        const { data: subscriptions, error: subscriptionsError } = await admin
          .from('push_subscriptions')
          .select('id,endpoint,p256dh,auth_key')
          .eq('user_id', job.user_id)
          
        if (subscriptionsError) throw subscriptionsError

        // If no subscriptions, delete the job and move on
        if (!subscriptions?.length) {
          await admin.from('gym_reminder_jobs').delete().eq('id', job.id)
          continue
        }

        const missed = job.reminder_type === 'missed'
        const payload = JSON.stringify({
          title: missed ? 'A missed workout is a chance to reset' : 'Your workout is in an hour',
          body: missed ? randomQuote(missedQuotes) : randomQuote(beforeQuotes),
          tag: `gains-${job.reminder_type}-${job.workout_date}`,
          url: '/',
        })

        let deliveredToAtLeastOne = false

        for (const subscription of subscriptions as PushSubscriptionRow[]) {
          if (!isAllowedPushEndpoint(subscription.endpoint)) {
            console.error(`Rejected unsupported push endpoint for ${job.user_id}.`)
            failures++
            continue
          }
          try {
            await webpush.sendNotification({
              endpoint: subscription.endpoint,
              keys: { p256dh: subscription.p256dh, auth: subscription.auth_key },
            }, payload)
            deliveredToAtLeastOne = true
            sent++
          } catch (error) {
            const code = statusCode(error)
            if (code === 404 || code === 410) {
              const { error: deleteError } = await admin.from('push_subscriptions')
                .delete().eq('id', subscription.id)
              if (deleteError) console.error('Could not remove expired push subscription.', deleteError)
            } else {
              console.error(`Could not send ${job.reminder_type} reminder to ${job.user_id}.`, error)
              failures++
            }
          }
        }

        // 3. Delete the job after processing so it doesn't send again
        await admin.from('gym_reminder_jobs').delete().eq('id', job.id)

      } catch (error) {
        console.error(`Failed to process job ${job.id}:`, error)
        failures++
      }
    }

    return Response.json({ sent, failures })
  } catch (error) {
    console.error('Gym reminder job failed.', error)
    return Response.json({ error: 'Gym reminder job failed.' }, { status: 500 })
  }
})