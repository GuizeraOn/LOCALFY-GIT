const token = 'H4sIAAAAAAAAAA3M27ZjMAAA0C86s%2BpaHlMxGkVSCcVLV5CqO1Ot8vVz3vfaYnOfuVPUuHZptCMpqNELDaFWWEhH7ZTElmv%2BEZvbiTOocWMrGFYahpEcMPBC%2FXTg9Bc2YPcbsGUw3bybL6VyugSOW2f0oAZN2Hvs1PkwbtKbrQSw7Pz6N%2B2LHU42HsH3jWft8U89lZ%2FZx4%2FrOZb33vTEcJTL%2BcYGrKj7ORI5OX2acbQDvTW0bZhvF7B%2BB2fjladf6Bt8YpcN8voko%2B3yeScNoQtG14pXvLXcxmdOGYsoN8bCkL6ttrAUGECdlZyN1vgspo9UkrAouGV4l1ayIPWEifjELjrCkSr0cGPvcC73l7qZNH5VJ5av9CXTpd38dwM5kZzjuPB6xudojNR8pyxXfI08f%2B50O2EhUdjuFkEWSKzDrLT2kf1N0KETx3BxXMA9cNc%2FBsxyuR9T1D2ucGpJ8Y35QdjraphpNRfGRIgY7CQpMtoawzW0HndpzX6SFdpwMafm%2Bh8yh0E00AEAAA%3D%3D';

async function testUrl(urlStr) {
  const res = await fetch(urlStr, { headers: { Authorization: `Bearer ${token}` } });
  console.log(`URL: ${urlStr}`);
  console.log(`Status: ${res.status}`);
  if (!res.ok) {
    console.log(await res.text());
  }
  console.log('---');
}

async function run() {
  const endDateMs = Date.parse('2026-09-07T23:59:59.999Z');
  const startDateMs = Date.parse('2026-08-31T00:00:00.000Z');
  
  await testUrl(`https://developers.hotmart.com/payments/api/v1/sales/history?max_results=50&start_date=${startDateMs}&end_date=${endDateMs}`);
}
run();
