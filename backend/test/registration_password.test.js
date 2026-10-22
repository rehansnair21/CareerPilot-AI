import test from 'node:test';
import assert from 'node:assert/strict';
import {
  validateRegistrationPassword,
  validateRegistrationConfirmPassword,
  registerUser,
} from '../controllers/authController.js';

test('Password Validation Specification Suite', async (t) => {
  await t.test('1. Empty password -> "Password is required."', () => {
    assert.equal(validateRegistrationPassword(''), 'Password is required.');
    assert.equal(validateRegistrationPassword('   '), 'Password is required.');
    assert.equal(validateRegistrationPassword(null), 'Password is required.');
    assert.equal(validateRegistrationPassword(undefined), 'Password is required.');
  });

  await t.test('2. Minimum length -> "Password must be at least 8 characters long."', () => {
    assert.equal(validateRegistrationPassword('Ab1!'), 'Password must be at least 8 characters long.');
    assert.equal(validateRegistrationPassword('Ab1!567'), 'Password must be at least 8 characters long.');
  });

  await t.test('3. Uppercase -> "Password must contain at least one uppercase letter."', () => {
    assert.equal(validateRegistrationPassword('password123!'), 'Password must contain at least one uppercase letter.');
    assert.equal(validateRegistrationPassword('abcdefgh1!'), 'Password must contain at least one uppercase letter.');
  });

  await t.test('4. Lowercase -> "Password must contain at least one lowercase letter."', () => {
    assert.equal(validateRegistrationPassword('PASSWORD123!'), 'Password must contain at least one lowercase letter.');
    assert.equal(validateRegistrationPassword('ABCDEFGH1@'), 'Password must contain at least one lowercase letter.');
  });

  await t.test('5. Number -> "Password must contain at least one number."', () => {
    assert.equal(validateRegistrationPassword('Password!@#'), 'Password must contain at least one number.');
    assert.equal(validateRegistrationPassword('SecretPass!'), 'Password must contain at least one number.');
  });

  await t.test('6. Special character -> "Password must contain at least one special character."', () => {
    assert.equal(validateRegistrationPassword('Password123'), 'Password must contain at least one special character.');
    assert.equal(validateRegistrationPassword('Password123   '), 'Password must contain at least one special character.');
  });

  await t.test('7. Empty confirm password -> "Please confirm your password."', () => {
    assert.equal(validateRegistrationConfirmPassword('', 'ValidPass1!'), 'Please confirm your password.');
    assert.equal(validateRegistrationConfirmPassword('   ', 'ValidPass1!'), 'Please confirm your password.');
    assert.equal(validateRegistrationConfirmPassword(null, 'ValidPass1!'), 'Please confirm your password.');
  });

  await t.test('8. Confirm password mismatch -> "Passwords do not match."', () => {
    assert.equal(validateRegistrationConfirmPassword('ValidPass1@', 'ValidPass1!'), 'Passwords do not match.');
    assert.equal(validateRegistrationConfirmPassword('DifferentPass', 'ValidPass1!'), 'Passwords do not match.');
  });

  await t.test('9. Valid password & matching confirm password pass validation', () => {
    assert.equal(validateRegistrationPassword('ValidPass1!'), null);
    assert.equal(validateRegistrationConfirmPassword('ValidPass1!', 'ValidPass1!'), null);
  });

  await t.test('10. registerUser endpoint handles all password validation errors', async () => {
    const mockRes = () => {
      const res = { statusCode: 200, body: null };
      res.status = (c) => { res.statusCode = c; return res; };
      res.json = (d) => { res.body = d; return res; };
      return res;
    };

    // Missing password
    const resEmptyPass = mockRes();
    await registerUser({ body: { name: 'Test', email: 't@example.com', password: '', confirmPassword: '' } }, resEmptyPass);
    assert.equal(resEmptyPass.statusCode, 400);
    assert.equal(resEmptyPass.body.message, 'Password is required.');

    // Short password
    const resShort = mockRes();
    await registerUser({ body: { name: 'Test', email: 't@example.com', password: 'P1!', confirmPassword: 'P1!' } }, resShort);
    assert.equal(resShort.statusCode, 400);
    assert.equal(resShort.body.message, 'Password must be at least 8 characters long.');

    // Missing uppercase
    const resNoUpper = mockRes();
    await registerUser({ body: { name: 'Test', email: 't@example.com', password: 'pass12345!', confirmPassword: 'pass12345!' } }, resNoUpper);
    assert.equal(resNoUpper.statusCode, 400);
    assert.equal(resNoUpper.body.message, 'Password must contain at least one uppercase letter.');

    // Missing lowercase
    const resNoLower = mockRes();
    await registerUser({ body: { name: 'Test', email: 't@example.com', password: 'PASS12345!', confirmPassword: 'PASS12345!' } }, resNoLower);
    assert.equal(resNoLower.statusCode, 400);
    assert.equal(resNoLower.body.message, 'Password must contain at least one lowercase letter.');

    // Missing number
    const resNoNum = mockRes();
    await registerUser({ body: { name: 'Test', email: 't@example.com', password: 'Password!@#', confirmPassword: 'Password!@#' } }, resNoNum);
    assert.equal(resNoNum.statusCode, 400);
    assert.equal(resNoNum.body.message, 'Password must contain at least one number.');

    // Missing special char
    const resNoSpecial = mockRes();
    await registerUser({ body: { name: 'Test', email: 't@example.com', password: 'Password123', confirmPassword: 'Password123' } }, resNoSpecial);
    assert.equal(resNoSpecial.statusCode, 400);
    assert.equal(resNoSpecial.body.message, 'Password must contain at least one special character.');

    // Missing confirm password
    const resNoConfirm = mockRes();
    await registerUser({ body: { name: 'Test', email: 't@example.com', password: 'ValidPass1!', confirmPassword: '' } }, resNoConfirm);
    assert.equal(resNoConfirm.statusCode, 400);
    assert.equal(resNoConfirm.body.message, 'Please confirm your password.');

    // Mismatched confirm password
    const resMismatch = mockRes();
    await registerUser({ body: { name: 'Test', email: 't@example.com', password: 'ValidPass1!', confirmPassword: 'DifferentPass1!' } }, resMismatch);
    assert.equal(resMismatch.statusCode, 400);
    assert.equal(resMismatch.body.message, 'Passwords do not match.');
  });
});
