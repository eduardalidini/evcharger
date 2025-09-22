import '../css/app.css';

import { createInertiaApp } from '@inertiajs/react';
import { resolvePageComponent } from 'laravel-vite-plugin/inertia-helpers';
import { createRoot } from 'react-dom/client';
import { initializeTheme } from './hooks/use-appearance';
import './i18n';
import Echo from 'laravel-echo';
import Pusher from 'pusher-js';

// Setup Laravel Echo for WebSocket broadcasting with Reverb
window.Pusher = Pusher;

// Configure Echo for Reverb
window.Echo = new Echo({
    broadcaster: 'reverb',
    key: import.meta.env.VITE_REVERB_APP_KEY || 'app_key',
    wsHost: import.meta.env.VITE_REVERB_HOST || 'localhost',
    wsPort: import.meta.env.VITE_REVERB_PORT || 8080,
    wssPort: import.meta.env.VITE_REVERB_PORT || 8080,
    forceTLS: (import.meta.env.VITE_REVERB_SCHEME || 'http') === 'https',
    enabledTransports: ['ws', 'wss'],
    disableStats: true,
    authEndpoint: '/broadcasting/auth',
    auth: {
        headers: {
            'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') || '',
            'Accept': 'application/json',
            'Content-Type': 'application/json',
            'X-Requested-With': 'XMLHttpRequest',
        },
    },
    withCredentials: true,
});

console.log('🔗 Echo configured for Reverb:', window.Echo);

// Monitor connection status - Reverb compatible approach
function setupReverbConnection() {
    try {
        // For Reverb, we need to access the connection differently
        const connector = window.Echo.connector;
        
        if (connector && connector.socket) {
            console.log('🔄 Setting up Reverb WebSocket connection monitoring...');
            
            // Listen for connection events on the socket
            connector.socket.on('connect', () => {
                console.log('✅ WebSocket connected to Reverb');
                console.log('🔗 Connection details:', {
                    host: import.meta.env.VITE_REVERB_HOST || 'localhost',
                    port: import.meta.env.VITE_REVERB_PORT || 8080,
                    key: import.meta.env.VITE_REVERB_APP_KEY || 'app_key'
                });
            });

            connector.socket.on('disconnect', () => {
                console.log('❌ WebSocket disconnected from Reverb');
            });

            connector.socket.on('connect_error', (error: any) => {
                console.error('❌ WebSocket connection error:', error);
            });

            // Monitor for auth errors
            connector.socket.on('error', (error: any) => {
                console.error('❌ WebSocket error:', error);
                if (error.code === 403) {
                    console.error('❌ Authentication/Authorization failed');
                }
            });

        } else if (connector && connector.pusher) {
            // Fallback for Pusher-like API if available
            console.log('🔄 Using Pusher-compatible connection monitoring...');
            
            connector.pusher.connection.bind('connected', () => {
                console.log('✅ WebSocket connected to Reverb');
            });

            connector.pusher.connection.bind('disconnected', () => {
                console.log('❌ WebSocket disconnected from Reverb');
            });

            connector.pusher.connection.bind('error', (error: any) => {
                console.error('❌ WebSocket error:', error);
            });
        } else {
            console.log('⚠️ Echo connector not ready, will retry in 1 second...');
            setTimeout(setupReverbConnection, 1000);
        }
    } catch (error) {
        console.error('❌ Error setting up Reverb connection monitoring:', error);
        // Retry after delay
        setTimeout(setupReverbConnection, 1000);
    }
}

// Initialize connection monitoring
setupReverbConnection();

console.log('🔗 Reverb WebSocket debugging enabled');

const appName = import.meta.env.VITE_APP_NAME || 'Laravel';

createInertiaApp({
    title: (title) => title ? `${title} - ${appName}` : appName,
    resolve: (name) => resolvePageComponent(`./pages/${name}.tsx`, import.meta.glob('./pages/**/*.tsx')),
    setup({ el, App, props }) {
        const root = createRoot(el);

        root.render(<App {...props} />);
    },
    progress: {
        color: '#4B5563',
    },
});

// This will set light / dark mode on load...
initializeTheme();
