/*
// utils/AdManager.js
import { Platform } from 'react-native';
import { AdMobInterstitial } from 'expo-ads-admob';

// Expo's test ad unit IDs
const testInterstitialAdUnitID = Platform.select({
  android: 'ca-app-pub-3940256099942544/1033173712',
  ios: 'ca-app-pub-3940256099942544/4411468910',
});

export const showInterstitialAd = async () => {
  try {
    await AdMobInterstitial.setAdUnitID(testInterstitialAdUnitID);
    await AdMobInterstitial.requestAdAsync();
    await AdMobInterstitial.showAdAsync();
  } catch (error) {
    console.error('Failed to show interstitial ad:', error);
  }
};
*/


/*import { Platform } from 'react-native';
import { AdMobBanner, AdMobInterstitial, AdMobRewarded } from 'expo-ads-admob';

const testBannerAdUnitID = Platform.select({
   android: 'ca-app-pub-3940256099942544/6300978111',
});

const testInterstitialAdUnitID = Platform.select({
  android: 'ca-app-pub-3940256099942544/1033173712',
});

const testRewardedAdUnitID = Platform.select({
   android: 'ca-app-pub-3940256099942544/5224354917',
});

export const showBannerAd = () => (
  <AdMobBanner
    bannerSize="smartBannerPortrait"
    adUnitID={testBannerAdUnitID}
    servePersonalizedAds={true}
    onDidFailToReceiveAdWithError={(error) => console.error(error)}
  />
);

export const showInterstitialAd = async () => {
  await AdMobInterstitial.setAdUnitID(testInterstitialAdUnitID);
  try {
    await AdMobInterstitial.requestAdAsync();
    await AdMobInterstitial.showAdAsync();
  } catch (error) {
    console.error('Failed to show interstitial ad:', error);
  }
};

export const showRewardedAd = async () => {
  await AdMobRewarded.setAdUnitID(testRewardedAdUnitID);
  try {
    await AdMobRewarded.requestAdAsync();
    await AdMobRewarded.showAdAsync();
  } catch (error) {
    console.error('Failed to show rewarded ad:', error);
  }
};
*/