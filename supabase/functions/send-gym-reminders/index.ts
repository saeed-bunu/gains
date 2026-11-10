import webpush from 'npm:web-push@3.6.7'
import { createClient } from 'npm:@supabase/supabase-js@2'

type GymSchedule = {
  user_id: string
  training_days: number[]
  gym_time: string
  timezone: string
}

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

function dateKey(date: string, offset: number) {
  const shifted = new Date(`${date}T12:00:00.000Z`)
  shifted.setUTCDate(shifted.getUTCDate() + offset)
  return shifted.toISOString().slice(0, 10)
}

function localClock(date: Date, timezone: string) {
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone: timezone,
    weekday: 'short',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hourCycle: 'h23',
  }).formatToParts(date)
  const values = Object.fromEntries(parts.map(({ type, value }) => [type, value]))
  const weekday = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].indexOf(values.weekday)
  if (weekday < 0) throw new Error(`Could not determine local weekday for timezone ${timezone}`)
  return {
    date: `${values.year}-${values.month}-${values.day}`,
    weekday,
    minute: Number(values.hour) * 60 + Number(values.minute),
  }
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

    const { data: schedules, error: scheduleError } = await admin
      .from('gym_schedules')
      .select('user_id,training_days,gym_time,timezone')
    if (scheduleError) throw scheduleError

    const now = new Date()
    let sent = 0
    let failures = 0
    for (const schedule of (schedules ?? []) as GymSchedule[]) {
      let clock: ReturnType<typeof localClock>
      try {
        clock = localClock(now, schedule.timezone)
      } catch (error) {
        console.error(`Invalid timezone for user ${schedule.user_id}.`, error)
        failures++
        continue
      }

      const [gymHours, gymMinutes] = schedule.gym_time.split(':').map(Number)
      const gymMinute = gymHours * 60 + gymMinutes
      const candidates = [
        { type: 'before' as const, target: gymMinute - 60, workoutOffset: gymMinute < 60 ? 1 : 0 },
        { type: 'missed' as const, target: gymMinute + 120, workoutOffset: gymMinute + 120 >= 1440 ? -1 : 0 },
      ]

      for (const candidate of candidates) {
        const targetMinute = (candidate.target + 1440) % 1440
        const minutesAfterTarget = (clock.minute - targetMinute + 1440) % 1440
        if (minutesAfterTarget > 3) continue

        const workoutDate = dateKey(clock.date, candidate.workoutOffset)
        const workoutWeekday = (new Date(`${workoutDate}T12:00:00.000Z`).getUTCDay() + 6) % 7
        if (!schedule.training_days.includes(workoutWeekday)) continue

        if (candidate.type === 'missed') {
          const { data: checkin, error: checkinError } = await admin
            .from('workout_checkins')
            .select('completed_at')
            .eq('user_id', schedule.user_id)
            .eq('workout_date', workoutDate)
            .maybeSingle()
          if (checkinError) {
            console.error(`Could not check workout completion for ${schedule.user_id}.`, checkinError)
            failures++
            continue
          }
          if (checkin) continue
        }

        const { data: delivery, error: deliveryError } = await admin
          .from('gym_reminder_deliveries')
          .upsert({
            user_id: schedule.user_id,
            workout_date: workoutDate,
            reminder_type: candidate.type,
          }, { onConflict: 'user_id,workout_date,reminder_type', ignoreDuplicates: true })
          .select('user_id')
          .maybeSingle()
        if (deliveryError) throw deliveryError
        if (!delivery) continue

        const { data: subscriptions, error: subscriptionsError } = await admin
          .from('push_subscriptions')
          .select('id,endpoint,p256dh,auth_key')
          .eq('user_id', schedule.user_id)
        if (subscriptionsError) throw subscriptionsError
        if (!subscriptions?.length) {
          await admin.from('gym_reminder_deliveries').delete()
            .eq('user_id', schedule.user_id)
            .eq('workout_date', workoutDate)
            .eq('reminder_type', candidate.type)
          continue
        }

        const missed = candidate.type === 'missed'
        const payload = JSON.stringify({
          title: missed ? 'A missed workout is a chance to reset' : 'Your workout is in an hour',
          body: missed ? randomQuote(missedQuotes) : randomQuote(beforeQuotes),
          tag: `gains-${candidate.type}-${workoutDate}`,
          url: '/',
        })
        let deliveredToAtLeastOne = false
        for (const subscription of subscriptions as PushSubscriptionRow[]) {
          if (!isAllowedPushEndpoint(subscription.endpoint)) {
            console.error(`Rejected unsupported push endpoint for ${schedule.user_id}.`)
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
              console.error(`Could not send ${candidate.type} reminder to ${schedule.user_id}.`, error)
              failures++
            }
          }
        }

        if (!deliveredToAtLeastOne) {
          await admin.from('gym_reminder_deliveries').delete()
            .eq('user_id', schedule.user_id)
            .eq('workout_date', workoutDate)
            .eq('reminder_type', candidate.type)
        }
      }
    }

    return Response.json({ sent, failures })
  } catch (error) {
    console.error('Gym reminder job failed.', error)
    return Response.json({ error: 'Gym reminder job failed.' }, { status: 500 })
  }
})
