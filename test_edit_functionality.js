// Test Edit Functionality
// Jalankan di browser console setelah buka halaman Manajemen User

// Test 1: Cek apakah tombol edit ada
function testEditButtons() {
  console.log('=== TEST 1: EDIT BUTTONS ===');
  const editButtons = document.querySelectorAll('.edit-btn');
  console.log('Found edit buttons:', editButtons.length);

  if (editButtons.length > 0) {
    console.log('✅ Edit buttons found');
    return true;
  } else {
    console.log('❌ No edit buttons found');
    return false;
  }
}

// Test 2: Cek apakah modal bisa dibuka
function testModalOpen() {
  console.log('=== TEST 2: MODAL OPEN ===');

  // Klik tombol edit pertama
  const firstEditButton = document.querySelector('.edit-btn');
  if (firstEditButton) {
    console.log('Clicking first edit button...');
    firstEditButton.click();

    // Cek apakah modal muncul
    setTimeout(() => {
      const modal = document.querySelector('.modal-overlay');
      if (modal) {
        console.log('✅ Modal opened successfully');
        return true;
      } else {
        console.log('❌ Modal did not open');
        return false;
      }
    }, 1000);
  } else {
    console.log('❌ No edit button found to click');
    return false;
  }
}

// Test 3: Cek apakah form data dimuat
function testFormData() {
  console.log('=== TEST 3: FORM DATA ===');

  const modal = document.querySelector('.modal-overlay');
  if (!modal) {
    console.log('❌ No modal found');
    return false;
  }

  const namaInput = modal.querySelector('input[id="nama"]');
  if (namaInput) {
    console.log('✅ Nama input found, value:', namaInput.value);
    return true;
  } else {
    console.log('❌ Nama input not found');
    return false;
  }
}

// Test 4: Cek apakah update berfungsi
async function testUpdate() {
  console.log('=== TEST 4: UPDATE FUNCTION ===');

  try {
    const result = await supabase
      .from('users')
      .update({ nama: 'Test Update ' + Date.now() })
      .eq('id', 'd443523c-86eb-4758-aa79-ca8586b60927')
      .select();

    if (result.error) {
      console.log('❌ Update failed:', result.error);
      return false;
    } else {
      console.log('✅ Update successful:', result.data);
      return true;
    }
  } catch (err) {
    console.log('❌ Update error:', err);
    return false;
  }
}

// Run all tests
async function runAllTests() {
  console.log('🚀 STARTING EDIT FUNCTIONALITY TESTS');

  const test1 = testEditButtons();
  if (!test1) return;

  const test2 = testModalOpen();
  if (!test2) return;

  setTimeout(() => {
    const test3 = testFormData();
    if (!test3) return;

    testUpdate().then(result => {
      if (result) {
        console.log('🎉 ALL TESTS PASSED - Edit functionality should work!');
      } else {
        console.log('❌ Update test failed - Check database permissions');
      }
    });
  }, 2000);
}

// Export untuk console
window.testEditFunctionality = runAllTests;
