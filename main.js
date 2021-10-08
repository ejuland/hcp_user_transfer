const axios = require('axios')
const fs = require('fs');

const TEMPLATE_USR_ENDPOINT = "https://jsonplaceholder.typicode.com/users";
const HCP_USER_ENDPOINT = "https://dev.app.homecarepulse.com/Primary/?FlowId=7423bd80-cddb-11ea-9160-326dddd3e106&Action=api";


// Looks for a file called hcp_credentials.json for authentication data
const AUTH_FILE = fs.readFileSync("./hcp_credentials.json");
const HCP_CREDENTIALS = JSON.parse(AUTH_FILE);
const HCP_USER_ID = HCP_CREDENTIALS.userid;
const HCP_PASSWORD = HCP_CREDENTIALS.password;

/**
 * Gets a template users list from the jsonplaceholder API
 */
function getTemplateUsers() {
    return axios.get(TEMPLATE_USR_ENDPOINT).then(res => res.data);
}

/**
 * Takes a list of HCP users and then sends it to the HCP server
 * The data is sent as part of a package with authentication credentials and the output type; 
 */
function sendUsersToHCP(user_data) {
    const body = {
        "userid": HCP_USER_ID,
        "password": HCP_PASSWORD,
        "outputtype": "Json",
        "users": user_data
    };

    return axios.post(HCP_USER_ENDPOINT, JSON.stringify(body));
}

/** 
 * An array filter function to remove any values which are a common honorific
 */
function filterTitles(name) {
    return !name.match(/(Dr|Esq|Hon|Jr|Mrs|Mr|Msgr|Ms|Messrs|Mmes|Prof|Rev|Rt|Sr|St)(\.)*/g)
}

/**
 * Takes a template user and transfoms it into the HCP format
 */
function formatUser(user) {
    let names = user.name.split(/\s/).filter(filterTitles);
    return {

        "first_name": names.shift(),
        "last_name": names.pop(),
        "company_name": user.company.name,
        "company_full_address": `${user.address.street}, ${user.address.city}, ${user.address.zipcode}`,
        "website": user.website,
        "phone": user.phone,

    }
}

/**
 * Takes an array of template users and transforms them into the HCP format
 */
function usersToHCPFormat(users) {
    let formatted_users = users.map(formatUser);
    return formatted_users;
}

/**
 * Handles Simple HTTP Errors 
 */
async function handleHTTPError(res) {
    if (res.status || res.text) {
        console.error(`An HTTP Error Occured\nStatus: ${res.status}\nmessage: "${await res.text()}"`);
    } else
        console.error(res);
}

/**
 * Takes a set of template users from the jsonplaceholder database, 
 * transforms it into the HCP format, 
 * and then puts it into the HCP server
 */
async function transferTemplateUsersToHCP() {

    getTemplateUsers()
        .then(usersToHCPFormat)
        .then(sendUsersToHCP)
        .catch(handleHTTPError)
}

transferTemplateUsersToHCP();