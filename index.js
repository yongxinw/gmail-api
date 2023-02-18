/**
 * Copyright 2022 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     https://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
/* eslint-disable camelcase */
// [START gmail_quickstart]
const fs = require('fs').promises;
const path = require('path');
const process = require('process');
const {authenticate} = require('@google-cloud/local-auth');
const {google} = require('googleapis');
const utils = require('util');
const base64 = require('base-64');

// If modifying these scopes, delete token.json.
const SCOPES = ['https://www.googleapis.com/auth/gmail.readonly', 'https://www.googleapis.com/auth/gmail.send', 'https://www.googleapis.com/auth/gmail.modify', 'https://www.googleapis.com/auth/gmail.compose',];
// The file token.json stores the user's access and refresh tokens, and is
// created automatically when the authorization flow completes for the first
// time.
const TOKEN_PATH = path.join(process.cwd(), 'token.json');
const CREDENTIALS_PATH = path.join(process.cwd(), 'credentials.json');

/**
 * Reads previously authorized credentials from the save file.
 *
 * @return {Promise<OAuth2Client|null>}
 */
async function loadSavedCredentialsIfExist() {
  try {
    const content = await fs.readFile(TOKEN_PATH);
    const credentials = JSON.parse(content);
    return google.auth.fromJSON(credentials);
  } catch (err) {
    return null;
  }
}

/**
 * Serializes credentials to a file comptible with GoogleAUth.fromJSON.
 *
 * @param {OAuth2Client} client
 * @return {Promise<void>}
 */
async function saveCredentials(client) {
  const content = await fs.readFile(CREDENTIALS_PATH);
  const keys = JSON.parse(content);
  const key = keys.installed || keys.web;
  const payload = JSON.stringify({
    type: 'authorized_user',
    client_id: key.client_id,
    client_secret: key.client_secret,
    refresh_token: client.credentials.refresh_token,
  });
  await fs.writeFile(TOKEN_PATH, payload);
}

/**
 * Load or request or authorization to call APIs.
 *
 */
async function authorize() {
  let client = await loadSavedCredentialsIfExist();
  if (client) {
    return client;
  }
  client = await authenticate({
    scopes: SCOPES,
    keyfilePath: CREDENTIALS_PATH,
  });
  if (client.credentials) {
    await saveCredentials(client);
  }
  return client;
}

/**
 * Lists the labels in the user's account.
 *
 * @param {google.auth.OAuth2} auth An authorized OAuth2 client.
 */
async function listLabels(auth) {
  const gmail = google.gmail({version: 'v1', auth});
  const res = await gmail.users.labels.list({
    userId: 'me',
  });
  const labels = res.data.labels;
  if (!labels || labels.length === 0) {
    console.log('No labels found.');
    return;
  }
  console.log('Labels:');
  labels.forEach((label) => {
    console.log(`- ${label.name}`);
  });
}

async function listEmail(auth) {
    const gmail = google.gmail({version: 'v1', auth});
    const res = await gmail.users.messages.list({
        userId: 'me',
        maxResults: 10
    });
    const emails = res.data.messages;
    if (!emails || emails.length === 0) {
        console.log('no email found');
        return;
    }
    console.log('my emails:');
    emails.forEach((em) => {
        console.log(em.id)
        console.log(em)
        console.log('==================')
    })

    console.log(`getting email content for ${emails.at(0).id}`)

    const contentRes = await gmail.users.messages.get({
        userId: 'me',
        id: emails.at(0).id
    });

    const emailContent = contentRes.data
    var data = emailContent.payload.parts.at(0).body.data
    data = data.replaceAll("-", "+")
    data = data.replaceAll("_", "/")
    console.log(typeof(data))
    console.log(data)
    console.log(base64.decode(data))
}

function makeBody(to, from, subject, message) {
    var str = [
        "Content-Type: text/plain; charset=\"UTF-8\"\n",
        "MIME-Version: 1.0\n",
        "Content-Transfer-Encoding: 7bit\n",
        "to: ", to, "\n",
        "from: ", from, "\n",
        "subject: ", subject, "\n\n",
        message
    ].join('');

    var encodedMail = base64.encode(str);
    var encodedMail = encodedMail.replaceAll(/\+/g, '-');
    var encodedMail = encodedMail.replaceAll(/\//g, '_');
    
    // var encodedMail = new Buffer(str).toString("base64").replace(/\+/g, '-').replace(/\//g, '_');
    return encodedMail;
}

async function sendEmail(auth) {
    const gmail = google.gmail({version: 'v1', auth});
    var message = makeBody("cyj.issac@gmail.com", "wangyongxin1994@gmail.com", "test subject", "Got my message? Bruh?")
    gmail.users.messages.send({
        auth: auth,
        userId: 'me',
        resource: {
            raw: message
        }
    }, function(err, res) {
        console.log(`err: ${err}`);
        console.log(`res: ${res}`);
    });
}

// authorize().then(listLabels).catch(console.error);
// authorize().then(listEmail).catch(console.error);
authorize().then(sendEmail).catch(console.error);
// [END gmail_quickstart]