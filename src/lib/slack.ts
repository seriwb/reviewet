import Slack from 'slack-node';

let slack = new Slack();
slack.setWebhook(process.env.SLACK_WEBHOOK!);

export const slackClient: Slack = slack;