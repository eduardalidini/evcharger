import '../css/app.css';

import { createInertiaApp } from '@inertiajs/react';
import { resolvePageComponent } from 'laravel-vite-plugin/inertia-helpers';
import { createRoot } from 'react-dom/client';
import { initializeTheme } from './hooks/use-appearance';
import './i18n';
import Echo from 'laravel-echo';
import Pusher from 'pusher-js';

// Setup Laravel Echo for WebSocket broadcasting
window.Pusher = Pusher;

window.Echo = new Echo({
    broadcaster: 'reverb',
    key: import.meta.env.VITE_REVERB_APP_KEY || 'app_key',
    wsHost: import.meta.env.VITE_REVERB_HOST || 'localhost',
    wsPort: import.meta.env.VITE_REVERB_PORT || 8080,
    wssPort: import.meta.env.VITE_REVERB_PORT || 8080,
    forceTLS: false,
    enabledTransports: ['ws'],
    disableStats: true,
    authEndpoint: '/broadcasting/auth',
    auth: {
        headers: {
            'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') || '',
            'Accept': 'application/json',
            'Content-Type': 'application/json',
        },
    },
    authorizer: (channel: any, options: any) => {
        return {
            authorize: (socketId: string, callback: Function) => {
                fetch('/broadcasting/auth', {
                    method: 'POST',
                    headers: {
                        'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') || '',
                        'Accept': 'application/json',
                        'Content-Type': 'application/json',
                        'X-Requested-With': 'XMLHttpRequest',
                    },
                    credentials: 'same-origin',
                    body: JSON.stringify({
                        socket_id: socketId,
                        channel_name: channel.name,
                    }),
                })
                .then((response) => {
                    if (response.ok) {
                        return response.json();
                    }
                    throw new Error('Authentication failed');
                })
                .then((data) => {
                    callback(null, data);
                })
                .catch((error) => {
                    console.error('Echo authentication error:', error);
                    callback(error, null);
                });
            },
        };
    },
});

console.log('🔗 Echo configured:', window.Echo);

// Monitor connection status
window.Echo.connector.pusher.connection.bind('connected', () => {
    console.log('✅ WebSocket connected to Reverb');
});

window.Echo.connector.pusher.connection.bind('disconnected', () => {
    console.log('❌ WebSocket disconnected from Reverb');
});

window.Echo.connector.pusher.connection.bind('error', (error: any) => {
    console.error('❌ WebSocket connection error:', error);
});

// Monitor auth errors
window.Echo.connector.pusher.connection.bind('subscription_error', (error: any) => {
    console.error('❌ WebSocket subscription error:', error);
});

window.Echo.connector.pusher.connection.bind('auth_error', (error: any) => {
    console.error('❌ WebSocket authentication error:', error);
});

// Add global error handler for debugging
window.Echo.connector.pusher.bind('pusher:error', (error: any) => {
    console.error('❌ Pusher error:', error);
});

console.log('🔗 WebSocket debugging enabled - check console for auth errors');

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
