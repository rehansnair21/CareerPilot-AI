import test from 'node:test';
import assert from 'node:assert/strict';
import {
  validateRegistrationName,
  registerUser,
} from '../controllers/authController.js';

test('Full Name Validation Specification Suite', async (t) => {
  await t.test('1. Required Field: Empty or only spaces -> "Full name is required."', () => {
    assert.equal(validateRegistrationName(''), 'Full name is required.');
    assert.equal(validateRegistrationName('   '), 'Full name is required.');
    assert.equal(validateRegistrationName('      '), 'Full name is required.');
    assert.equal(validateRegistrationName(null), 'Full name is required.');
    assert.equal(validateRegistrationName(undefined), 'Full name is required.');
  });

  await t.test('2. Length Validation: Less than 3 characters -> "Name must be between 3 and 50 characters."', () => {
    assert.equal(validateRegistrationName('a'), 'Name must be between 3 and 50 characters.');
    assert.equal(validateRegistrationName('Jo'), 'Name must be between 3 and 50 characters.');
    assert.equal(validateRegistrationName('  Jo  '), 'Name must be between 3 and 50 characters.');
  });

  await t.test('3. Length Validation: More than 50 characters -> "Name must be between 3 and 50 characters."', () => {
    const fiftyOneChars = 'a'.repeat(51);
    assert.equal(validateRegistrationName(fiftyOneChars), 'Name must be between 3 and 50 characters.');
    const sixtyChars = 'Alex '.repeat(12);
    assert.equal(validateRegistrationName(sixtyChars), 'Name must be between 3 and 50 characters.');
  });

  await t.test('4. Length Validation: Exactly 3 and 50 characters are valid', () => {
    assert.equal(validateRegistrationName('Bob'), null);
    assert.equal(validateRegistrationName('a'.repeat(50)), null);
    assert.equal(validateRegistrationName('A B'), null);
  });

  await t.test('5. Character Validation: Reject numbers -> "Name can contain only letters and spaces."', () => {
    assert.equal(validateRegistrationName('John123'), 'Name can contain only letters and spaces.');
    assert.equal(validateRegistrationName('12345'), 'Name can contain only letters and spaces.');
    assert.equal(validateRegistrationName('User 1'), 'Name can contain only letters and spaces.');
    assert.equal(validateRegistrationName('John 2nd'), 'Name can contain only letters and spaces.');
  });

  await t.test('6. Character Validation: Reject special characters -> "Name can contain only letters and spaces."', () => {
    assert.equal(validateRegistrationName('John@Doe'), 'Name can contain only letters and spaces.');
    assert.equal(validateRegistrationName('John_Doe'), 'Name can contain only letters and spaces.');
    assert.equal(validateRegistrationName('John-Doe'), 'Name can contain only letters and spaces.');
    assert.equal(validateRegistrationName('John.Doe'), 'Name can contain only letters and spaces.');
    assert.equal(validateRegistrationName('John!'), 'Name can contain only letters and spaces.');
    assert.equal(validateRegistrationName('John # Doe'), 'Name can contain only letters and spaces.');
  });

  await t.test('7. Character Validation: Allow valid letters and spaces only', () => {
    assert.equal(validateRegistrationName('John Doe'), null);
    assert.equal(validateRegistrationName('Mary Jane Watson'), null);
    assert.equal(validateRegistrationName('Alice Smith'), null);
    assert.equal(validateRegistrationName('Dr John Watson'), null);
  });

  await t.test('8. registerUser endpoint handles all name validation error responses', async () => {
    const mockRes = () => {
      const res = { statusCode: 200, body: null };
      res.status = (c) => { res.statusCode = c; return res; };
      res.json = (d) => { res.body = d; return res; };
      return res;
    };

    // Missing / empty name
    const resEmptyName = mockRes();
    await registerUser({ body: { name: '', email: 'test@example.com', password: 'ValidPassword1!', confirmPassword: 'ValidPassword1!' } }, resEmptyName);
    assert.equal(resEmptyName.statusCode, 400);
    assert.equal(resEmptyName.body.message, 'Full name is required.');
    assert.equal(resEmptyName.body.errors.name, 'Full name is required.');

    // Only spaces name
    const resSpacesName = mockRes();
    await registerUser({ body: { name: '    ', email: 'test@example.com', password: 'ValidPassword1!', confirmPassword: 'ValidPassword1!' } }, resSpacesName);
    assert.equal(resSpacesName.statusCode, 400);
    assert.equal(resSpacesName.body.message, 'Full name is required.');
    assert.equal(resSpacesName.body.errors.name, 'Full name is required.');

    // Too short name (2 chars)
    const resShortName = mockRes();
    await registerUser({ body: { name: 'Jo', email: 'test@example.com', password: 'ValidPassword1!', confirmPassword: 'ValidPassword1!' } }, resShortName);
    assert.equal(resShortName.statusCode, 400);
    assert.equal(resShortName.body.message, 'Name must be between 3 and 50 characters.');
    assert.equal(resShortName.body.errors.name, 'Name must be between 3 and 50 characters.');

    // Too long name (51 chars)
    const resLongName = mockRes();
    await registerUser({ body: { name: 'a'.repeat(51), email: 'test@example.com', password: 'ValidPassword1!', confirmPassword: 'ValidPassword1!' } }, resLongName);
    assert.equal(resLongName.statusCode, 400);
    assert.equal(resLongName.body.message, 'Name must be between 3 and 50 characters.');
    assert.equal(resLongName.body.errors.name, 'Name must be between 3 and 50 characters.');

    // Numbers in name
    const resNumName = mockRes();
    await registerUser({ body: { name: 'John123', email: 'test@example.com', password: 'ValidPassword1!', confirmPassword: 'ValidPassword1!' } }, resNumName);
    assert.equal(resNumName.statusCode, 400);
    assert.equal(resNumName.body.message, 'Name can contain only letters and spaces.');
    assert.equal(resNumName.body.errors.name, 'Name can contain only letters and spaces.');

    // Special characters in name
    const resSpecialName = mockRes();
    await registerUser({ body: { name: 'John@Doe', email: 'test@example.com', password: 'ValidPassword1!', confirmPassword: 'ValidPassword1!' } }, resSpecialName);
    assert.equal(resSpecialName.statusCode, 400);
    assert.equal(resSpecialName.body.message, 'Name can contain only letters and spaces.');
    assert.equal(resSpecialName.body.errors.name, 'Name can contain only letters and spaces.');
  });
});
