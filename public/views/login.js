
View.register('login', (messageData) => {
  if (messageData.sessionUserData && messageData.login) {
    const session = messageData.login == 'session';
    Storage.set('loginName', messageData.sessionUserData.username, session);
    Storage.set('loginHash', messageData.sessionUserData.loginHash, session);
    View.load('index');
  }
});
