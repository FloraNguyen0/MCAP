async function main (){
    const Meetcap = await ethers.getContractFactory('Meetcap');
    console.log('Deploying Meetcap...');
    const meetcap = await Meetcap.deploy();
    await meetcap.deployed();
    console.log('Meetcap deployed to:', meetcap.address);
}

main()
    .then(() => process.exit(0))
    .catch(error => {
        console.error(error);
        process.exit(1);
    });