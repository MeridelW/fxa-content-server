/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

define([
  'intern',
  'intern!object',
  'tests/lib/helpers',
  'tests/functional/lib/helpers',
  'tests/functional/lib/selectors'
], function (intern, registerSuite, TestHelpers, FunctionalHelpers, selectors) {
  'use strict';

  const config = intern.config;
  const SIGNIN_PAGE_URL = `${config.fxaContentRoot}signin?context=fx_fennec_v1&service=sync`;
  const SMS_PAGE_URL = `${config.fxaContentRoot}sms?context=fx_desktop_v1&service=sync&forceExperiment=sendSms&forceExperimentGroup=signinCodes`;

  let email;
  const PASSWORD = '12345678';

  const {
    clearBrowserState,
    click,
    closeCurrentWindow,
    createUser,
    deleteAllSms,
    fillOutSignIn,
    fillOutSignInUnblock,
    getSmsSigninCode,
    openPage,
    openVerificationLinkInDifferentBrowser,
    openVerificationLinkInNewTab,
    respondToWebChannelMessage,
    switchToWindow,
    testElementExists,
    testElementTextEquals,
    testElementTextInclude,
    testIsBrowserNotified,
    thenify,
    type,
  } = FunctionalHelpers;

  const setupTest = thenify(function (successSelector, options) {
    options = options || {};

    return this.parent
      .then(clearBrowserState())
      .then(createUser(email, PASSWORD, { preVerified: options.preVerified }))
      .then(openPage(SIGNIN_PAGE_URL, selectors.SIGNIN.HEADER))
      .then(respondToWebChannelMessage('fxaccounts:can_link_account', { ok: true } ))
      .then(fillOutSignIn(email, PASSWORD))
      .then(testElementExists(successSelector))
      .then(testIsBrowserNotified('fxaccounts:can_link_account'))
      .then(() => {
        if (! options.blocked) {
          return this.parent
            .then(testIsBrowserNotified('fxaccounts:login'));
        }
      });
  });

  registerSuite({
    name: 'Fx Fennec Sync v1 sign_in',

    beforeEach: function () {
      email = TestHelpers.createEmail('sync{id}');
    },

    'verified, verify same browser': function () {
      return this.remote
        .then(setupTest(selectors.CONFIRM_SIGNIN.HEADER, { preVerified: true }))

        .then(openVerificationLinkInNewTab(email, 0))
        .then(switchToWindow(1))
          .then(testElementExists(selectors.SIGNIN_COMPLETE.HEADER))
          .then(closeCurrentWindow())

        .then(testElementExists(selectors.SIGNIN_COMPLETE.HEADER));
    },

    'verified, verify different browser - from original tab\'s P.O.V.': function () {
      return this.remote
        .then(setupTest(selectors.CONFIRM_SIGNIN.HEADER, { preVerified: true }))

        .then(openVerificationLinkInDifferentBrowser(email))

        .then(testElementExists(selectors.SIGNIN_COMPLETE.HEADER));
    },

    'unverified': function () {
      return this.remote
        .then(setupTest(selectors.CONFIRM_SIGNUP.HEADER, { preVerified: false }))

        // email 0 - initial sign up email
        // email 1 - sign in w/ unverified address email
        // email 2 - "You have verified your Firefox Account"
        .then(openVerificationLinkInNewTab(email, 1))
        .then(switchToWindow(1))
          .then(testElementExists(selectors.CONNECT_ANOTHER_DEVICE.HEADER))
          .then(closeCurrentWindow())

        .then(testElementExists(selectors.SIGNUP_COMPLETE.HEADER));
    },

    'blocked, valid code entered': function () {
      email = TestHelpers.createEmail('block{id}');

      return this.remote
        .then(setupTest(selectors.SIGNIN_UNBLOCK.HEADER, { blocked: true, preVerified: true }))

        .then(testElementTextInclude(selectors.SIGNIN_UNBLOCK.EMAIL_FIELD, email))
        .then(fillOutSignInUnblock(email, 0))

        .then(testElementExists(selectors.SIGNIN_COMPLETE.HEADER))
        .then(testIsBrowserNotified('fxaccounts:login'));
    },

    'signup in desktop, send an SMS, open deferred deeplink in Fennec': function () {
      const TEST_PHONE_NUMBER = config.fxaTestPhoneNumber;
      let signinUrlWithSigninCode;

      return this.remote
        // The phoneNumber is reused across tests, delete all
        // if its SMS messages to ensure a clean slate.
        .then(deleteAllSms(TEST_PHONE_NUMBER))
        .then(setupTest(selectors.CONFIRM_SIGNUP.HEADER))

        .then(openPage(SMS_PAGE_URL, selectors.SMS_SEND.HEADER))
        .then(type(selectors.SMS_SEND.PHONE_NUMBER, TEST_PHONE_NUMBER))
        .then(click(selectors.SMS_SEND.SUBMIT))

        .then(testElementExists(selectors.SMS_SENT.HEADER))
        .then(getSmsSigninCode(TEST_PHONE_NUMBER, 0))
        .then(function (signinCode) {
          signinUrlWithSigninCode = `${SIGNIN_PAGE_URL}&signin=${signinCode}`;
          return this.parent
            .then(clearBrowserState())
            .then(openPage(signinUrlWithSigninCode, selectors.SIGNIN.HEADER))
            .then(testElementTextEquals(selectors.SIGNIN.EMAIL_NOT_EDITABLE, email));
        });
    }
  });
});
