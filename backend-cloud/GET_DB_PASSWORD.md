# 🔑 GET YOUR DATABASE PASSWORD

## Quick Steps:

1. **Go to Supabase Dashboard**: https://supabase.com/dashboard
2. **Select your project**: mkxedrrmxckgphetzdgm
3. **Click Settings** (bottom left)
4. **Click Database**
5. **Scroll to "Connection string"**
6. **Click the "URI" tab**
7. **Your password is in the connection string after `postgres:`**

OR

1. **Settings** → **Database**
2. **Click "Reset Database Password"** button
3. **Copy the new password**
4. **SAVE IT SOMEWHERE SAFE!**

## Then Add to Your .env File:

Add this line to your `.env` file:

```bash
DATABASE_URL=postgresql://postgres.mkxedrrmxckgphetzdgm:YOUR_PASSWORD_HERE@aws-1-ap-south-1.pooler.supabase.com:5432/postgres
```

Replace `YOUR_PASSWORD_HERE` with your actual database password.

## Example:

If your password is `MySecretPass123`, it would look like:

```bash
DATABASE_URL=postgresql://postgres.mkxedrrmxckgphetzdgm:MySecretPass123@aws-1-ap-south-1.pooler.supabase.com:5432/postgres
```

---

**Once you add this, restart your server with:**
```bash
python manage.py runserver
```
