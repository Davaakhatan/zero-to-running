// Browser Console Test for Undo/Redo (4 Actions)
// Copy and paste this into the browser console while on the canvas page

console.log('🚀 Starting browser-based undo/redo test...');

// Helper function to wait
const wait = (ms) => new Promise(resolve => setTimeout(resolve, ms));

// Helper function to check button states
const checkButtonStates = () => {
  const undoBtn = document.querySelector('button:has-text("Undo")');
  const redoBtn = document.querySelector('button:has-text("Redo")');
  
  if (!undoBtn || !redoBtn) {
    console.log('❌ Undo/Redo buttons not found!');
    return { undoDisabled: null, redoDisabled: null };
  }
  
  const undoDisabled = undoBtn.disabled;
  const redoDisabled = redoBtn.disabled;
  
  console.log(`   Undo disabled: ${undoDisabled}, Redo disabled: ${redoDisabled}`);
  return { undoDisabled, redoDisabled };
};

// Helper function to click button
const clickButton = async (buttonText) => {
  const btn = document.querySelector(`button:has-text("${buttonText}")`);
  if (btn && !btn.disabled) {
    btn.click();
    await wait(1000);
    return true;
  }
  return false;
};

// Main test function
const runTest = async () => {
  try {
    console.log('\n📊 Test 1: Checking initial state...');
    checkButtonStates();
    
    console.log('\n🎯 Test 2: Performing 4 actions...');
    
    // Action 1: Add Rectangle
    console.log('   Action 1: Adding Rectangle...');
    await clickButton('Add Shape');
    await wait(500);
    await clickButton('Rectangle');
    await wait(1000);
    checkButtonStates();
    
    // Action 2: Add Circle
    console.log('   Action 2: Adding Circle...');
    await clickButton('Add Shape');
    await wait(500);
    await clickButton('Circle');
    await wait(1000);
    checkButtonStates();
    
    // Action 3: Add Text
    console.log('   Action 3: Adding Text...');
    await clickButton('Add Shape');
    await wait(500);
    await clickButton('Text');
    await wait(1000);
    checkButtonStates();
    
    // Action 4: Add Triangle
    console.log('   Action 4: Adding Triangle...');
    await clickButton('Add Shape');
    await wait(500);
    await clickButton('Triangle');
    await wait(1000);
    checkButtonStates();
    
    console.log('\n↩️ Test 3: Undoing all 4 actions...');
    
    // Undo all 4 actions
    for (let i = 4; i >= 1; i--) {
      console.log(`   Undo ${i}: Clicking Undo button...`);
      const success = await clickButton('Undo');
      if (success) {
        checkButtonStates();
      } else {
        console.log('   ❌ Undo button not clickable!');
        break;
      }
    }
    
    console.log('\n↪️ Test 4: Redoing all 4 actions...');
    
    // Redo all 4 actions
    for (let i = 1; i <= 4; i++) {
      console.log(`   Redo ${i}: Clicking Redo button...`);
      const success = await clickButton('Redo');
      if (success) {
        checkButtonStates();
      } else {
        console.log('   ❌ Redo button not clickable!');
        break;
      }
    }
    
    console.log('\n⌨️ Test 5: Testing keyboard shortcuts...');
    
    // Test Ctrl+Z (Undo)
    console.log('   Testing Ctrl+Z (Undo)...');
    document.dispatchEvent(new KeyboardEvent('keydown', {
      key: 'z',
      ctrlKey: true,
      bubbles: true
    }));
    await wait(1000);
    checkButtonStates();
    
    // Test Ctrl+Shift+Z (Redo)
    console.log('   Testing Ctrl+Shift+Z (Redo)...');
    document.dispatchEvent(new KeyboardEvent('keydown', {
      key: 'z',
      ctrlKey: true,
      shiftKey: true,
      bubbles: true
    }));
    await wait(1000);
    checkButtonStates();
    
    console.log('\n✅ Browser-based undo/redo test completed!');
    
  } catch (error) {
    console.error('❌ Test failed:', error);
  }
};

// Run the test
runTest();
