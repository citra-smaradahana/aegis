@echo off
echo ========================================
echo AGGRESSIVE CLEANUP - Hapus Semua File Tidak Perlu
echo ========================================
echo.

echo Menghapus SEMUA file tidak perlu...

REM Hapus SEMUA file batch kecuali yang baru
if exist cleanup-files.bat del cleanup-files.bat
if exist run-fixed.bat del run-fixed.bat
if exist run-with-sidebar.bat del run-with-sidebar.bat
if exist dev.bat del dev.bat
if exist localhost.bat del localhost.bat
if exist run-dev.bat del run-dev.bat
if exist start-dev.bat del start-dev.bat
if exist clean-all-deployments.bat del clean-all-deployments.bat
if exist deploy.bat del deploy.bat
if exist manual-setup.bat del manual-setup.bat
if exist setup-github.bat del setup-github.bat
if exist setup-github-vercel.bat del setup-github-vercel.bat
if exist start-app.bat del start-app.bat

REM Hapus SEMUA file dokumentasi kecuali README.md
if exist LOCALHOST_DEVELOPMENT.md del LOCALHOST_DEVELOPMENT.md
if exist CLEANUP_INSTRUCTIONS.md del CLEANUP_INSTRUCTIONS.md
if exist PWA_README.md del PWA_README.md
if exist deploy-to-github.md del deploy-to-github.md
if exist READMEY.md del READMEY.md
if exist INSTRUCTIONS.md del INSTRUCTIONS.md
if exist QUICK-START.md del QUICK-START.md
if exist BUILD_SUMMARY.md del BUILD_SUMMARY.md
if exist CHANGELOG.md del CHANGELOG.md
if exist DEPLOYMENT.md del DEPLOYMENT.md
if exist sinkronisasi_fit_to_work.md del sinkronisasi_fit_to_work.md
if exist logika_validasi_baru.md del logika_validasi_baru.md
if exist hierarchy_simple.md del hierarchy_simple.md
if exist hierarchy_validator_fit_to_work.md del hierarchy_validator_fit_to_work.md
if exist BSIB_LOCATION_UPDATE.md del BSIB_LOCATION_UPDATE.md

REM Hapus SEMUA file SQL
if exist *.sql del *.sql

REM Hapus file deployment dan konfigurasi
if exist vercel.json del vercel.json
if exist .github del .github
if exist dist.zip del dist.zip
if exist env.example del env.example
if exist build-and-deploy.sh del build-and-deploy.sh
if exist setup-github-vercel.ps1 del setup-github-vercel.ps1

REM Hapus file lain yang tidak diperlukan
if exist test_edit_functionality.js del test_edit_functionality.js
if exist "h origin main" del "h origin main"
if exist tmy-react-app del tmy-react-app
if exist .prettierrc del .prettierrc
if exist .prettierignore del .prettierignore
if exist LICENSE del LICENSE

echo.
echo ✅ SEMUA file tidak perlu berhasil dihapus!
echo.
echo Struktur folder yang bersih:
echo Test/
echo └── my-react-app/          # Root folder aplikasi React
echo     ├── package.json       # ✅ Dependencies
echo     ├── package-lock.json  # ✅ Lock file
echo     ├── vite.config.js     # ✅ Konfigurasi Vite
echo     ├── tailwind.config.js # ✅ Konfigurasi Tailwind
echo     ├── postcss.config.js  # ✅ Konfigurasi PostCSS
echo     ├── eslint.config.js   # ✅ Konfigurasi ESLint
echo     ├── index.html         # ✅ Entry point
echo     ├── .gitignore         # ✅ Git ignore
echo     ├── src/               # ✅ Kode React
echo     ├── public/            # ✅ Asset statis
echo     ├── node_modules/      # ✅ Dependencies
echo     ├── .git/              # ✅ Git repository
echo     ├── run.bat            # ✅ Script menjalankan
echo     ├── clean-now.bat      # ✅ Script cleanup
echo     └── README.md          # ✅ Dokumentasi
echo.
echo Sekarang folder SANGAT bersih dan hanya berisi file yang diperlukan!
echo.
pause 