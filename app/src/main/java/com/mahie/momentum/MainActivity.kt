package com.mahie.momentum

import android.Manifest
import android.app.Activity
import android.os.Build
import android.os.Bundle
import androidx.activity.ComponentActivity
import androidx.activity.compose.setContent
import androidx.activity.enableEdgeToEdge
import androidx.activity.result.contract.ActivityResultContracts
import androidx.compose.animation.Crossfade
import androidx.compose.foundation.background
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.darkColorScheme
import androidx.compose.material3.lightColorScheme
import androidx.compose.runtime.*
import androidx.compose.runtime.saveable.rememberSaveable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.platform.LocalView
import androidx.core.view.WindowCompat
import androidx.lifecycle.viewmodel.compose.viewModel

class MainActivity : ComponentActivity() {
    private val askNotifications =
        registerForActivityResult(ActivityResultContracts.RequestPermission()) { /* result is re-read on demand */ }

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        enableEdgeToEdge()

        Notifier.ensureChannel(this)
        if (Build.VERSION.SDK_INT >= 33 && !Notifier.canNotify(this)) {
            askNotifications.launch(Manifest.permission.POST_NOTIFICATIONS)
        }
        SyncWorker.schedule(this) // background check for events.json changes, every ~15 min

        setContent { MomentumApp() }
    }
}

@Composable
fun MomentumApp(vm: MainViewModel = viewModel()) {
    val pal = if (vm.dark) DarkPal else LightPal
    val view = LocalView.current
    SideEffect {
        val window = (view.context as Activity).window
        WindowCompat.getInsetsController(window, view).apply {
            isAppearanceLightStatusBars = !vm.dark
            isAppearanceLightNavigationBars = !vm.dark
        }
    }

    CompositionLocalProvider(LocalPal provides pal) {
        MaterialTheme(
            colorScheme = if (vm.dark) darkColorScheme(primary = pal.up, background = pal.bg, surface = pal.card)
            else lightColorScheme(primary = pal.up, background = pal.bg, surface = pal.card),
        ) {
            var dest by rememberSaveable { mutableStateOf(Dest.HOME) }
            Box(Modifier.fillMaxSize().background(pal.bg)) {
                Crossfade(dest, label = "page") { d ->
                    when (d) {
                        Dest.HOME -> HomeScreen(vm)
                        Dest.UPDATES -> UpdatesScreen(vm)
                        Dest.ABOUT -> AboutScreen(vm)
                    }
                }
                BottomNav(dest, vm.updateAvailable, { dest = it }, Modifier.align(Alignment.BottomCenter))
            }
        }
    }
}
