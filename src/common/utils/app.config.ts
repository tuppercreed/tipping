export interface AppConfig {
    aflEndpoint: string;
    local: boolean;
    round: number;
    roundMax: number;
    redirectUrl: string;
}

export const AppConfig: AppConfig = {
    aflEndpoint: "https://api.squiggle.com.au/",
    local: true,
    round: 7,
    roundMax: 23,
    redirectUrl: 'http://localhost:3000'
}