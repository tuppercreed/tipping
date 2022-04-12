export interface AppConfig {
    aflEndpoint: string;
    local: boolean;
}

export const AppConfig: AppConfig = {
    aflEndpoint: "https://api.squiggle.com.au/",
    local: true,
}