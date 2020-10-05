document.addEventListener('DOMContentLoaded', function () {

  // Use buttons to toggle between views
  document.querySelector('#inbox').addEventListener('click', () => load_mailbox('inbox'));
  document.querySelector('#sent').addEventListener('click', () => load_mailbox('sent'));
  document.querySelector('#archived').addEventListener('click', () => load_mailbox('archive'));
  document.querySelector('#compose').addEventListener('click', compose_email);

  // By default, load the inbox
  load_mailbox('inbox');
});

function compose_email() {

  // Show compose view and hide other views
  document.querySelector('#compose-view').style.display = 'block';
  document.querySelector('#mailbox-view').style.display = 'none';
  document.querySelector('#email-view').style.display = 'none';

  // Clear out composition fields
  document.querySelector('#compose-recipients').value = '';
  document.querySelector('#compose-subject').value = '';
  document.querySelector('#compose-body').value = '';

  send_email();
}

function send_email() {
  document.querySelector('#compose-form').onsubmit = () => {
    const recipients = document.querySelector('#compose-recipients').value;
    const subject = document.querySelector('#compose-subject').value;
    const body = document.querySelector('#compose-body').value;

    fetch('/emails', {
      method: 'POST',
      body: JSON.stringify({
        recipients: recipients,
        subject: subject,
        body: body
      })
    })

      .then(response => response.json())
      .then(result => {
        console.log(result);
        load_mailbox('sent')
      })
    return false;
  }
}

function load_mailbox(mailbox) {

  // Show the mailbox and hide other views
  document.querySelector('#mailbox-view').style.display = 'block';
  document.querySelector('#compose-view').style.display = 'none';
  document.querySelector('#email-view').style.display = 'none';

  // Show the mailbox name
  document.querySelector('#mailbox-view').innerHTML = `<h3>${mailbox.charAt(0).toUpperCase() + mailbox.slice(1)}</h3>`;

  fetch(`/emails/${mailbox}`)
    .then(response => response.json())
    .then(emails => {
      emails.forEach(email => {
        sender_recipients = mailbox === 'sent' ? email.recipients : email.sender
        a = `<b>${sender_recipients}</b>`
        b = `<span class="subject">${email.subject}</span>`
        c = `<span class="timestamp">${email.timestamp}</span>`

        const EmailDiv = document.createElement('div')
        EmailDiv.innerHTML = `${a}${b}${c}`
        EmailDiv.className = email.read ? 'email read' : 'email'
        EmailDiv.onclick = () => view_email(email, mailbox)
        document.querySelector('#mailbox-view').append(EmailDiv)
      });
    });
}

function view_email(email, mailbox) {

  document.querySelector('#email-view').style.display = 'block';
  document.querySelector('#mailbox-view').style.display = 'none';
  document.querySelector('#compose-view').style.display = 'none';

  document.querySelector("#email-info").innerHTML = ""
  document.querySelector("#email-body").innerHTML = ""
  document.querySelector("#buttons").innerHTML = ""

  if (!email.read) {
    fetch(`/emails/${email.id}`, {
      method: 'PUT',
      body: JSON.stringify({
        read: true
      })
    })
  }

  fetch(`/emails/${email.id}`)
    .then(response => response.json())
    .then(email => {
      let reply = document.createElement('BUTTON')
      reply.className = 'btn btn-sm btn-outline-primary'
      reply.innerHTML = 'Reply'
      reply.addEventListener('click', () => reply_(email, mailbox))
      document.querySelector('#buttons').append(reply)

      if (mailbox !== 'sent') {
        let archive = document.createElement('BUTTON')
        archive.className = 'btn btn-sm btn-outline-primary'
        archive.innerHTML = email.archived ? 'Unarchive' : 'Archive'
        archive.addEventListener('click', () => archive_(email))
        document.querySelector('#buttons').append(archive)
      }

      document.querySelector('#email-info').innerHTML = `
      <b>From: </b>${email.sender}<br>
      <b>To: </b>${email.recipients}<br>
      <b>Subject: </b>${email.subject}<br>
      <b>Timestamp: </b>${email.timestamp}<br>
      `
      document.querySelector('#email-body').innerHTML = `${email.body}`
    });
}

function archive_(email) {
  fetch(`/emails/${email.id}`, {
    method: 'PUT',
    body: JSON.stringify({
      archived: email.archived ? false : true
    })
  })
    .then(() => load_mailbox('inbox'))
}

function reply_(email, mailbox) {
  compose_email()
  let subject = document.querySelector('#compose-subject')
  let recipients = document.querySelector('#compose-recipients')

  subject.value = (email.subject.substring(0, 3) !== 'Re:') ? `Re: ${email.subject}` : email.subject
  recipients.value = mailbox == 'sent' ? email.recipients : email.sender

  let dashes = '-'.repeat(100)
  let body = `On ${email.timestamp} ${email.sender} wrote:\n${email.body}\n${dashes}\n`
  document.querySelector('#compose-body').value = body
}
