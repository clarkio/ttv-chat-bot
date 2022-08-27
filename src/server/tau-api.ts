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
        Authorization: `Token ${config.tauToken}`,
      },
      method: 'PATCH',
      mode: 'cors',
      body: JSON.stringify({ status: 'FULFILLED' }),
    };

    const url = `https://${config.tauURL}/api/twitch/helix/channel_points/custom_rewards/redemptions?broadcaster_id=${broadcasterId}&reward_id=${rewardId}&id=${redemptionId}`;

    try {
      const result = await fetch(url, fetchOptions);
      return result;
    } catch (error) {
      console.error(error);
    }
  }
}
