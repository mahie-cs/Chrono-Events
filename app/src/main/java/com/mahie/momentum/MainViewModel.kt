package com.mahie.momentum

import android.app.Application
import android.content.Context
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.setValue
import androidx.core.content.edit
import androidx.lifecycle.AndroidViewModel
import androidx.lifecycle.viewModelScope
import kotlinx.coroutines.launch

class MainViewModel(app: Application) : AndroidViewModel(app) {
    private val prefs = app.getSharedPreferences("momentum", Context.MODE_PRIVATE)

    // ---- events ----
    var events by mutableStateOf<List<Event>>(emptyList()); private set
    var refreshing by mutableStateOf(value = false); private set
    var message by mutableStateOf<String?>(null); private set

    // ---- class schedule (schedule.json) ----
    var schedule by mutableStateOf<Schedule?>(null); private set

    // ---- theme (light by default, remembered) ----
    var dark by mutableStateOf(prefs.getBoolean("dark", false)); private set
    fun toggleDark() { dark = !dark; prefs.edit { putBoolean("dark", dark) } }

    // ---- app updates ----
    val installedVersion: String =
        runCatching { app.packageManager.getPackageInfo(app.packageName, 0).versionName }.getOrNull() ?: "1.0"
    var update by mutableStateOf<UpdateState>(UpdateState.Idle); private set
    var installHint by mutableStateOf<String?>(null); private set
    val updateAvailable get() = update is UpdateState.Available || update is UpdateState.Downloading || update is UpdateState.Ready

    init {
        EventRepository.cached(app)?.let {
            events = runCatching { EventRepository.parse(it) }.getOrDefault(emptyList())
        }
        ScheduleRepository.cached(app)?.let { schedule = runCatching { ScheduleRepository.parse(it) }.getOrNull() }
        refresh()
        checkUpdate()
    }

    fun refresh() {
        viewModelScope.launch {
            refreshing = true
            try {
                val json = EventRepository.fetch()
                events = EventRepository.parse(json)
                EventRepository.save(getApplication(), json)
                message = null
            } catch (_: Exception) {
                message = if (events.isEmpty()) "Couldn't load events. Pull down to retry."
                else "Offline — showing your last saved events."
            }
            try {
                val sj = ScheduleRepository.fetch()
                schedule = ScheduleRepository.parse(sj)
                ScheduleRepository.save(getApplication(), sj)
            } catch (_: Exception) {
                // schedule.json missing or offline: keep showing the saved copy
            }
            refreshing = false
        }
    }

    fun checkUpdate() {
        if (update is UpdateState.Checking || update is UpdateState.Downloading) return
        viewModelScope.launch {
            update = UpdateState.Checking
            installHint = null
            update = try {
                val info = Updater.latest()
                if (Updater.isNewer(info.version, installedVersion)) UpdateState.Available(info) else UpdateState.UpToDate
            } catch (e: Exception) {
                UpdateState.Error(e.message ?: "Couldn't reach GitHub.")
            }
        }
    }

    fun downloadUpdate() {
        val available = update as? UpdateState.Available ?: return
        viewModelScope.launch {
            update = UpdateState.Downloading(available.info, 0f)
            update = try {
                val f = Updater.download(getApplication(), available.info) { update = UpdateState.Downloading(available.info, it) }
                UpdateState.Ready(available.info, f)
            } catch (e: Exception) {
                UpdateState.Error("Download failed: ${e.message}")
            }
        }
    }

    fun installUpdate() {
        val r = update as? UpdateState.Ready ?: return
        installHint = if (Updater.install(getApplication(), r.file)) null
        else "Turn on \"Allow from this source\" for Momentum in the settings screen that just opened, come back, and tap Install again."
    }
}
