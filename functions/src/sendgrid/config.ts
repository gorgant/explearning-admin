import * as functions from 'firebase-functions';
import { adminFirestore } from '../db';
import * as sendGridMail from '@sendgrid/mail';
import { remoteCoachProductId, explearningPublicAppUrl, remoteCoachProductSlug } from '../environments/config';
import { PublicAppRoutes } from '../../../shared-models/routes-and-paths/app-routes.model';
import { ProductReferenceList } from '../../../shared-models/products/product-id-list.model';

// Iniitialize Cloud Firestore Database
export const db = adminFirestore;
const settings = { timestampsInSnapshots: true };
db.settings(settings);

// ENV Variables
export const sendgridSecret: string = functions.config().sendgrid.secret;

// Initialize SG and export
export const getSgMail = () => {
  const sendgrid = sendGridMail;
  sendGridMail.setApiKey(sendgridSecret);
  return sendgrid;
}


// Useful links for emails
const appUrl = explearningPublicAppUrl;
const blogSlugWithSlashPrefix = PublicAppRoutes.BLOG;
const blogUrl = `https://${appUrl}${blogSlugWithSlashPrefix}`;
const productListSlugWithSlashPrefix = PublicAppRoutes.PRODUCTS;
const remoteCoachUrl = `https://${appUrl}${productListSlugWithSlashPrefix}/${remoteCoachProductId}/${remoteCoachProductSlug}`;

export const EmailWebsiteLinks = {
  BLOG_URL: blogUrl,
  REMOTE_COACH_URL: remoteCoachUrl
};

export const getProductUrlById = (productId: string): string => {
  const productSlug = ProductReferenceList[productId].productUrlSlug;
  const url = `https://${appUrl}${productListSlugWithSlashPrefix}/${productId}/${productSlug}`;
  return url;
};
