export interface AppConfig {
    aflEndpoint: string;
    local: boolean;
    round: number;
}

export const AppConfig: AppConfig = {
    aflEndpoint: "https://api.squiggle.com.au/",
    local: true,
    round: 5,
}