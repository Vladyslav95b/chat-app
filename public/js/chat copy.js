const socket = io();

const messageForm = document.querySelector('#messageForm');
const messageForm_input = messageForm.querySelector('#messageForm_input');
const messageForm_button = messageForm.querySelector('#messageForm_button');
const messages = document.querySelector("#messages");

const location_btn = document.querySelector('#send_location');

//template
const messageTemplate = document.querySelector("#message-template").innerHTML
const locationTemplate = document.querySelector("#location-template").innerHTML

// counter
socket.on('countUpdated', (count) => {
    console.log('Count has been updated', count);
});

const btn = document.getElementById('increment');
btn.addEventListener('click', () => {
    console.log('click');
    socket.emit('increment');
});


//messanger
messageForm.addEventListener('submit', (e) => {
    e.preventDefault();

    messageForm_button.setAttribute('disabled', 'disabled')

    socket.emit('sendMessage', messageForm_input.value , (error) => {
        messageForm_button.removeAttribute('disabled')
        messageForm_input.value= '';
        messageForm_input.focus();
        if(error) {
            return console.log(error)
        }
        console.log('Message delivared');
    });
});

socket.on('message', (message) => {
    console.log(message);
    const html = Mustache.render(messageTemplate, {
        message: message.text,
        createdAt: moment(message.createdAt).format('h:mm a')
    })
    messages.insertAdjacentHTML('beforeend', html)
});

// location

socket.on('locationMessage', (message) => {
    console.log(message);

    const html =  Mustache.render(locationTemplate, {
        
            url: message.url,
            createdAt: moment(message.createdAt).format('h:mm a')
        
    })
    messages.insertAdjacentHTML('beforeend', html)
})


location_btn.addEventListener('click', () => {
    location_btn.setAttribute('disabled', 'disabled')
    if (!navigator.geolocation) {
        location_btn.removeAttribute('disabled')
        return alert('Geo doesnt support by your browser');
    }
    navigator.geolocation.getCurrentPosition((position) => {
        socket.emit('sendLocation', {latitude: position.coords.latitude, longitude: position.coords.longitude}, (ac_msg) => {
        location_btn.removeAttribute('disabled')
            
            console.log(ac_msg);
        })
    }, error => console.log(error));

});
