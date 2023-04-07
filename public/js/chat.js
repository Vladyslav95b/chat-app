const socket = io();

const messageForm = document.querySelector('#message-form');
const messageForm_input = messageForm.querySelector('#messageForm_input');
const messageForm_button = messageForm.querySelector('#messageForm_button');
const messages = document.querySelector('#messages');

const location_btn = document.querySelector('#send-location');

//template
const messageTemplate = document.querySelector('#message-template').innerHTML;
const locationTemplate = document.querySelector(
    '#location-message-template'
).innerHTML;
const sidebarTemplate = document.querySelector('#sidebar-template').innerHTML;

// Options
const { username, room } = Qs.parse(location.search, {
    ignoreQueryPrefix: true,
});

const autoscroll = () => {
    const newMessage = messages.lastElementChild

    const newMessageStyles = getComputedStyle(newMessage);
    const newMessageMargin = parseInt(newMessageStyles.marginBottom)
    const newMessageHeight = newMessage.offsetHeight + newMessageMargin;


    const visibleHeight = messages.offsetHeight;

    const contentHeight = messages.scrollHeight;

    const scrollOffset = messages.scrollTop + visibleHeight;

    if(contentHeight - newMessageHeight <= scrollOffset) {
        messages.scrollTop = messages.scrollHeight;
    }
}

//messanger
messageForm.addEventListener('submit', (e) => {
    e.preventDefault();

    messageForm_button.setAttribute('disabled', 'disabled');

    const message = e.target.elements.message.value;

    socket.emit('sendMessage', message, (error) => {
        messageForm_button.removeAttribute('disabled');
        messageForm_input.value = '';
        messageForm_input.focus();
        if (error) {
            return console.log(error);
        }
        console.log('Message delivared');
    });
});

socket.on('message', (message) => {
    console.log(message);
    const html = Mustache.render(messageTemplate, {
        username: message.username,
        message: message.text,
        createdAt: moment(message.createdAt).format('h:mm a'),
    });
    messages.insertAdjacentHTML('beforeend', html);
    autoscroll();
});

// location

socket.on('locationMessage', (message) => {
    console.log(message);

    const html = Mustache.render(locationTemplate, {
        username: message.username,
        url: message.url,
        createdAt: moment(message.createdAt).format('h:mm a'),
    });
    messages.insertAdjacentHTML('beforeend', html);
    autoscroll();
});

socket.on('roomData', ({ room, users }) => {
    const html = Mustache.render(sidebarTemplate, {
        room,
        users,
    });
    document.querySelector('#sidebar').innerHTML=html
});

location_btn.addEventListener('click', () => {
    location_btn.setAttribute('disabled', 'disabled');
    if (!navigator.geolocation) {
        location_btn.removeAttribute('disabled');
        return alert('Geo doesnt support by your browser');
    }
    navigator.geolocation.getCurrentPosition(
        (position) => {
            socket.emit(
                'sendLocation',
                {
                    latitude: position.coords.latitude,
                    longitude: position.coords.longitude,
                },
                (ac_msg) => {
                    location_btn.removeAttribute('disabled');

                    console.log(ac_msg);
                }
            );
        },
        (error) => console.log(error)
    );
});

socket.emit('join', { username, room }, (error) => {
    if (error) {
        alert(error);
        location.href = '/';
    }
});
