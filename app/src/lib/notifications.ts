type FeedbackAlertInput = {
  storeName: string;
  rating: number;
  comment: string;
  contact: string;
};

function buildMessage(input: FeedbackAlertInput): string {
  return [
    'New feedback received',
    `Store: ${input.storeName}`,
    `Rating: ${input.rating}/5`,
    `Comment: ${input.comment || '-'}`,
    `Contact: ${input.contact || '-'}`,
  ].join('\n');
}

async function sendTelegram(message: string): Promise<void> {
  const webhookUrl = process.env.TELEGRAM_WEBHOOK_URL;
  const botToken = process.env.TELEGRAM_BOT_TOKEN;
  const chatId = process.env.TELEGRAM_CHAT_ID;

  if (webhookUrl) {
    await fetch(webhookUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text: message }),
    });
    return;
  }

  if (botToken && chatId) {
    await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: chatId,
        text: message,
      }),
    });
  }
}

async function sendEmail(message: string): Promise<void> {
  const apiKey = process.env.RESEND_API_KEY;
  const from = process.env.RESEND_FROM_EMAIL;
  const to = process.env.ALERT_EMAIL_TO;

  if (!apiKey || !from || !to) {
    return;
  }

  await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      from,
      to: [to],
      subject: 'New store feedback',
      text: message,
    }),
  });
}

export async function sendFeedbackAlert(input: FeedbackAlertInput): Promise<void> {
  const message = buildMessage(input);

  try {
    await Promise.allSettled([sendTelegram(message), sendEmail(message)]);
  } catch (error) {
    console.error('feedback-notification-error', error);
  }
}

