
import { Client, messagingApi, Message, Profile } from '@line/bot-sdk';

const config = {
  channelAccessToken: process.env.LINE_CHANNEL_ACCESS_TOKEN!,
  channelSecret: process.env.LINE_CHANNEL_SECRET!,
};

const client = new Client(config);
const messagingApiClient = new messagingApi.MessagingApiClient(config);

export async function sendPushMessage(to: string, messages: Message[]): Promise<void> {
  try {
    await messagingApiClient.pushMessage({ to, messages });
  } catch (error) {
    console.error('Failed to send LINE push message:', error);
    // You might want to handle different error types from the API
    // For now, we just log it.
  }
}

export async function getLineProfile(accessToken: string): Promise<Profile> {
    try {
        const response = await fetch('https://api.line.me/v2/profile', {
            headers: {
                'Authorization': `Bearer ${accessToken}`
            }
        });
        if (!response.ok) {
            const errorBody = await response.json();
            throw new Error(`Failed to get LINE profile: ${errorBody.message}`);
        }
        return await response.json() as Profile;
    } catch (error) {
        console.error('Error fetching LINE profile:', error);
        throw error;
    }
}
