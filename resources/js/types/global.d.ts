interface Window {
    Echo?: {
        private: (channel: string) => {
            listen: (event: string, callback: (data: any) => void) => void;
        };
        leaveChannel: (channel: string) => void;
    };
}

declare global {
    interface Window {
        Echo?: any;
        Laravel?: {
            csrfToken: string;
        };
    }
}

export {};
