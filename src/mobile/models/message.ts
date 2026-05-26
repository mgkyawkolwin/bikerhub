export default class Message {
    id?: string;
    title?: string;
    body?: string;
    dateTimeUTC?: string;
    read: boolean = false;
}