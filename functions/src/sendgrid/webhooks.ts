import * as functions from 'firebase-functions';
import { EmailEvent } from '../../../shared-models/subscribers/email-event.model';
import { updateEmailRecord } from './handlers';
import { currentEnvironmentType } from '../environments/config';
import { EnvironmentTypes } from '../../../shared-models/environments/env-vars.model';

const isProductionEnv = (): boolean => {
  switch (currentEnvironmentType) {
    case EnvironmentTypes.PRODUCTION:
      return true;
    case EnvironmentTypes.SANDBOX:
      return false;
    default:
      return false;
  }
}

// Receives an invoice payload from stripe
export const sgEmailWebhookEndpoint = functions.https.onRequest(

  async (req, res) => {

    // Prevents test data from using production webhook
    // Sendgrid only allows one webhook, so be sure to switch Sendgrid webhook setting to the sandbox endpoint before commenting this out
    if (!isProductionEnv()) {
      console.log('Sandbox mode, canceling function, received this data', req.body);
      return;
    }

    try {

      const events: EmailEvent[] = req.body;
      console.log('Sending webhook data to handler', events);

      await updateEmailRecord(events)
        .catch(error => console.log('Error updating email records when contacting handler', error));

      res.sendStatus(200);
    } catch (err) {
      res.status(400).send(err);
    }
  }
);