# ユーザー操作

ユーザー登録→ユーザー検証を行うことで、ログイン可能な状態に移行する。

ログイン（サインイン）を実行することで、JWT（AccessToken, IdToken, RefreshToken）を取得する。
AccessTokenを使うことで、メールアドレスの更新を行うことができる。メールアドレス更新時には、更新検証を行う必要がある。
検証を行うまでは、変更前のメールアドレスでなければログインできない。

なお、検証にあたっては変更後のメールアドレスに対して検証コードが配信される。

---

## ユーザー登録

```
aws cognito-idp sign-up --client-id <client_id> \
--username <mail address> \
--password <password> \
--user-attributes Name=email,Value=<mail address>
```

---

## ユーザー検証

```
aws cognito-idp confirm-sign-up --client-id <client_id> \
--username <mail address> \
--confirmation-code <confirmation code>
```

---

## サインイン

```
aws cognito-idp initiate-auth --client-id <client_id> \
--auth-flow USER_PASSWORD_AUTH \
--auth-parameters USERNAME=<mail address>,PASSWORD=<password>
```

---

## メールアドレス更新

```
aws cognito-idp update-user-attributes \
--user-attributes Name=email,Value=<new mail address> \
--access-token <access_token obtained when initiate-auth>
```

注意事項: 変更後のメールアドレスに対して検証メールが配信されることに注意。

---

## メールアドレス検証

```
aws cognito-idp verify-user-attribute \
--access-token <access_token> \
--attribute-name email \
--code <confirmation_code>
```

---
