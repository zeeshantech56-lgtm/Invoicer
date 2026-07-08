// src/lib/access.js
import { TRIAL_DURATION_MS } from "./constants";

export function useAccessStatus(userData) {
  if (!userData) {
    return {
      hasAccess: false,
      isTrial: false,
      isSubscribed: false,
      daysLeftTrial: 0,
      daysLeftSub: 0,
      hasSubscribedBefore: false,
      expiryDateString: "",
      subUntilDate: null
    };
  }

  const now = Date.now();
  const createdAt = userData.createdAt?.toMillis() || now;
  const trialEnd = createdAt + TRIAL_DURATION_MS;
  const isTrial = now < trialEnd;
  const subUntil = userData.subscriptionUntil?.toMillis() || null;
  const isSubscribed = subUntil && now < subUntil;
  const hasAccess = isTrial || isSubscribed;
  
  const hasSubscribedBefore = !!userData.hasSubscribedBefore;
  
  const daysLeftTrial = Math.ceil((trialEnd - now) / (1000 * 60 * 60 * 24));
  const daysLeftSub = subUntil ? Math.ceil((subUntil - now) / (1000 * 60 * 60 * 24)) : 0;
  
  const subUntilDate = userData.subscriptionUntil?.toDate ? userData.subscriptionUntil.toDate() : (subUntil ? new Date(subUntil) : null);
  const expiryDateString = subUntilDate ? subUntilDate.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' }) : "";

  return {
    hasAccess,
    isTrial,
    isSubscribed,
    daysLeftTrial,
    daysLeftSub,
    hasSubscribedBefore,
    expiryDateString,
    subUntilDate
  };
}
