const fmcsaService = require('./services/fmcsaService');

async function test() {
    try {
        console.log('Testing FMCSA Service...');
        const result = await fmcsaService.fetchCarrierData('80806');
        console.log('Success:', JSON.stringify(result, null, 2));
    } catch (error) {
        console.error('Test Failed:', error);
    }
}

test();
