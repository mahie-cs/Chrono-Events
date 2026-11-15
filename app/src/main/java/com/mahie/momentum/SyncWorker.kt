package com.mahie.momentum

import android.content.Context
import androidx.work.*
import java.io.IOException
import java.time.format.TextStyle
import java.util.Locale
import java.util.concurrent.TimeUnit

/** Runs in the background (even when the app is closed) and checks events.json for changes. */
class SyncWorker(ctx: Context, params: WorkerParameters) : CoroutineWorker(ctx, params) {

    override suspend fun doWork(): Result {
        val ctx = applicationContext
        syncSchedule(ctx)
        return try {
            val json = EventRepository.fetch()
            val fresh = EventRepository.parse(json)
            val oldJson = EventRepository.cached(ctx)
            EventRepository.save(ctx, json)

            // No baseline yet (first ever run): remember the data, don't flood with notifications.
            if (oldJson != null) {
                val ch = EventRepository.diff(EventRepository.parse(oldJson), fresh)
                val items = ch.added.map { it to true } + ch.changed.map { it to false }
                items.take(MAX_SINGLE).forEach { (e, isNew) -> Notifier.postEvent(ctx, e, isNew) }
                val extra = items.size - MAX_SINGLE
                if (extra > 0) {
                    Notifier.post(ctx, 1, "Momentum", "$extra more updates", "$extra more events were added or changed. Open Momentum to see them.")
                } else if (items.isEmpty() && (ch.removed > 0)) {
                    Notifier.post(ctx, 2, "Momentum", "events.json changed", "${ch.removed} event(s) were removed from the calendar.")
                }
            }
            Result.success()
        } catch (_: IOException) {
            Result.retry()
        } catch (_: Exception) {
            Result.success()
        }
    }

    private suspend fun syncSchedule(ctx: Context) {
        try {
            val json = ScheduleRepository.fetch()
            val fresh = ScheduleRepository.parse(json)
            val oldJson = ScheduleRepository.cached(ctx)
            ScheduleRepository.save(ctx, json)
            if (oldJson != null) {
                val changed = ScheduleRepository.changedDays(ScheduleRepository.parse(oldJson), fresh)
                if (changed.isNotEmpty()) {
                    val days = changed.joinToString(", ") { it.getDisplayName(TextStyle.SHORT, Locale.ENGLISH) }
                    Notifier.post(
                        ctx, 3, "Schedule changed", "The class schedule was updated ($days).",
                        "The class schedule has been changed for: $days.\nOpen Momentum to see the new schedule.",
                    )
                }
            }
        } catch (_: Exception) {
            // no schedule.json yet, or offline: nothing to report
        }
    }

    companion object {
        private const val MAX_SINGLE = 5

        fun schedule(ctx: Context) {
            val req = PeriodicWorkRequestBuilder<SyncWorker>(15, TimeUnit.MINUTES)
                .setConstraints(Constraints.Builder().setRequiredNetworkType(NetworkType.CONNECTED).build())
                .build()
            WorkManager.getInstance(ctx)
                .enqueueUniquePeriodicWork("event-sync", ExistingPeriodicWorkPolicy.KEEP, req)
        }
    }
}
