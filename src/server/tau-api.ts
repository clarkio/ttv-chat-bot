import { injectable } from 'inversify';
import fetch from 'isomorphic-fetch';
import * as config from './config';
// import { TYPES } from './types';
// import { log } from './log';

@injectable()
export default class TauApi {
  /**
   *
   */
  constructor() {}

  public async completeChannelPointRedemption(
    broadcasterId: string,
    redemptionId: string,
    rewardId: string
  ) {
    const fetchOptions: RequestInit = {
      headers: {
        'Content-Type': 'application/json',
      },
      method: 'POST',
      mode: 'cors',
      body: JSON.stringify({ status: 'FULFILLED' }),
    };

    const url = `${config.tauURL}/api/twitch/helix/channel_points/custom_rewards/redemptions?broadcaster_id=${broadcasterId}&reward_id=${rewardId}&id=${redemptionId}`;

    try {
      await fetch(url, fetchOptions);
    } catch (error) {
      console.error(error);
    }
  }
}
