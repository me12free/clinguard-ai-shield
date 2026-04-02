# Fix "PHP is not recognized" (Windows)

PHP must be on your system **PATH** for `php` and `composer` to work in the terminal.

## Quick fix: use the batch scripts (no PATH change)

From `laravel-backend` you can run:

- **`serve.bat`** – starts the Laravel server (`php artisan serve`)
- **`composer_install.bat`** – runs Composer (`php composer.phar install`)
- **`run_tests.bat`** – runs tests (`php artisan test`)

These scripts look for PHP in common locations: `C:\xampp\php\php.exe`, `C:\laravel\herd\php\php.exe`, `C:\php\php.exe`. If your PHP is elsewhere, create a file named **`php_exe.txt`** in the `laravel-backend` folder containing a single line: the full path to `php.exe` (e.g. `D:\tools\php\php.exe`).

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
