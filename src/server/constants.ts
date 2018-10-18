export const effectCommand = (effect: any) => `trigger ${effect.type} ${[
        ...effect.colors
      ]}`.replace(',', ' ');
  
export const convApiUrl = (conversationId: string | undefined) => `https://directline.botframework.com/api/conversations/${
    conversationId
  }/messages`;

    // const url = 'https://directline.botframework.com/api/conversations';
export const v3ConvApiUrl = 'https://directline.botframework.com/v3/directline/conversations';
