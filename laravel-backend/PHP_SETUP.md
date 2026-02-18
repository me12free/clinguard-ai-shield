# Fix "PHP is not recognized" (Windows)

PHP must be on your system **PATH** for `php` and `composer` to work in the terminal.

## Option 1: Add existing PHP to PATH

If PHP is already installed (XAMPP, Laravel Herd, standalone, etc.):

1. **Find your PHP folder** (common locations):
   - `C:\xampp\php`
   - `C:\laravel\herd\php` (Herd)
   - `C:\php`
   - `C:\Program Files\PHP`

2. **Add it to PATH** (current user, persistent):
   ```powershell
   [Environment]::SetEnvironmentVariable("Path", $env:Path + ";C:\xampp\php", "User")
   ```
   Replace `C:\xampp\php` with your actual PHP folder (the one that contains `php.exe`).

3. **Restart the terminal** (and Cursor if needed), then run:
   ```bash
   php -v
   ```

## Option 2: Install PHP (Chocolatey)

If you use [Chocolatey](https://chocolatey.org):

```powershell
choco install php -y
```

Then restart the terminal and run `php -v`.

## Option 3: Laravel Herd (Windows)

[Herd](https://herd.laravel.com/windows) installs PHP and adds it to PATH. After installing, open a **new** terminal and run `php -v`.

## Composer not recognized

Composer needs PHP on PATH. Fix PHP first (see above), then:

- If you installed Composer globally: `composer install` and `composer update` will work.
- If you have only `composer.phar`: run `php composer.phar install` from the `laravel-backend` folder.

## After PHP and Composer work

From project root:

```bash
cd laravel-backend
composer install
composer update
php artisan key:generate
php artisan migrate
```
