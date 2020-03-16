import * as functions from 'firebase-functions';
import { adminFirestore } from '../config/db-config';
import { AdminCollectionPaths } from '../../../shared-models/routes-and-paths/fb-collection-paths';
import { EmailSubscriber, EmailSubscriberKeys } from '../../../shared-models/subscribers/email-subscriber.model';
import { now } from 'moment';
import { AdminTopicNames } from '../../../shared-models/routes-and-paths/fb-function-names';
import { SubscriptionSource } from '../../../shared-models/subscribers/subscription-source.model';
import { EmailCategories } from '../../../shared-models/email/email-vars.model';
import { PubSub } from '@google-cloud/pubsub';
import { adminProjectId } from '../config/environments-config';
import { EmailPubMessage } from '../../../shared-models/email/email-pub-message.model';
import { catchErrors } from '../config/global-helpers';
import admin = require('firebase-admin');

const pubSub = new PubSub();

// Trigger email send
const triggerOptInEmail = async(subscriber: EmailSubscriber) => {
  const topicName = AdminTopicNames.TRIGGER_EMAIL_SEND_TOPIC;
  const projectId = adminProjectId;
  const emailCategory = EmailCategories.OPT_IN_CONFIRMATION;
  const topic = pubSub.topic(`projects/${projectId}/topics/${topicName}`);
  const pubsubMsg: EmailPubMessage = {
    emailCategory,
    subscriber
  }
  const topicPublishRes = await topic.publishJSON(pubsubMsg)
    .catch(err => {console.log(`Failed to publish to topic "${topicName}" on project "${projectId}":`, err); return err;});
  console.log(`Publish to topic "${topicName}" on project "${projectId}" succeeded:`, topicPublishRes);
}

const executeActions = async (susbscriberData: EmailSubscriber) => {
  const newSubscriberData = susbscriberData;
  const subId = newSubscriberData.id;

  const db = adminFirestore;
  const subDocRef: FirebaseFirestore.DocumentReference = db.collection(AdminCollectionPaths.SUBSCRIBERS).doc(subId);
  const subDoc: FirebaseFirestore.DocumentSnapshot = await subDocRef.get()
    .catch(err => {console.log('Error fetching subscriber doc from admin database:', err); return err;});

  const isContactForm: boolean = newSubscriberData.lastSubSource === SubscriptionSource.CONTACT_FORM;
  const isExistingSubscriber: boolean = subDoc.exists;
  let subscriberHasOptedIn: boolean = false;
  if (isExistingSubscriber) {
    const existingSubscriberData = subDoc.data() as EmailSubscriber;
    subscriberHasOptedIn = existingSubscriberData.optInConfirmed ? true : false;
  }

  // Set or update subscriber sources
  const updateSubSources = {
    [EmailSubscriberKeys.SUBSCRIPTION_SOURCES]: admin.firestore.FieldValue.arrayUnion(newSubscriberData.lastSubSource),
  }

  // Set create date if new subscriber
  const setCreatedDate: Partial<EmailSubscriber> = isExistingSubscriber ? {} : {createdDate: now()};

  // Combine subscriber update data and set modified data
  const subscriberUpdate = {
    ...newSubscriberData,
    ...updateSubSources,
    ...setCreatedDate,
    [EmailSubscriberKeys.MODIFIED_DATE]: now()
  }

  console.log('Updating or creating subscriber with this data', subscriberUpdate);

  // Udpate subscriber with combined data
  await subDocRef.set(subscriberUpdate, {merge: true})
    .catch(err => {console.log('Error storing subscriber data in admin database:', err); return err;});
    
  // Send opt in email if NOT a contact form request and if subscriber has NOT opted in
  if (!isContactForm && !subscriberHasOptedIn) {
    
    console.log('Subscriber has not opted in yet and this is not a contact form, sending opt in confirmation email');
    // Trigger opt in email
    await triggerOptInEmail(newSubscriberData)
      .catch(err => {console.log('Error publishing opt in email topic to admin:', err); return err;});
  }

}


/////// DEPLOYABLE FUNCTIONS ///////

// Listen for pubsub message
export const storeEmailSub = functions.pubsub.topic(AdminTopicNames.SAVE_EMAIL_SUB_TOPIC).onPublish( async (message, context) => {

  const subscriberData = message.json as EmailSubscriber;
  console.log('Store email sub request received with this data:', subscriberData);
  console.log('Context from pubsub', context);

  return catchErrors(executeActions(subscriberData));

});



