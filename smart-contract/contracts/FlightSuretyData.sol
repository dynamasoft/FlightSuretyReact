pragma solidity ^0.4.24;

import "../node_modules/openzeppelin-solidity/contracts/math/SafeMath.sol";

contract FlightSuretyData {
    using SafeMath for uint256;

    /********************************************************************************************/
    /*                                       DATA VARIABLES                                     */
    /********************************************************************************************/
    uint256 private enabled = block.timestamp;
    // Account used to deploy contract
    address private contractOwner;
    uint8 private constant STATUS_CODE_LATE = 20;
    uint8 private constant STATUS_CODE_UNKNOWN = 0;
    uint256 constant MULTI_CONSENSUS_COUNT = 1;

    // Blocks all state changes throughout the contract if false
    bool private operational = true;
    address[] multiConsensus = new address[](0);

    // Restrict data contract callers
    mapping(address => uint256) private authorizedContracts;

    // Flights
    struct AirlineFlight {
        string flight;
        bool isRegistered;
        uint8 statusCode;
        uint256 flightTimeStamp;
        address airline;
        string from;
        string to;
    }

    // Airlines
    struct Airline {
        string name;
        bool hasPaid;
        bool isRegistered;
    }
    mapping(address => Airline) private airlines;
    address[] registeredAirlines = new address[](0);

    mapping(bytes32 => AirlineFlight) private flights;
    bytes32[] registeredFlights = new bytes32[](0);

    struct Insurance {
        address passenger;
        uint256 amount;
        uint256 multiplier;
        bool isCredited;
    }

    mapping(bytes32 => Insurance[]) passengersInsurancePerFlight;
    mapping(address => uint256) public pendingPayments;

    /********************************************************************************************/
    /*                                       CONSTRUCTOR                                        */
    /********************************************************************************************/

    /**
     * @dev Constructor
     *      The deploying account becomes contractOwner
     */
    constructor(string memory firstAirlineName, address firstAirlineAddress)
        public
    {
        contractOwner = msg.sender;

        // First airline initialization
        airlines[firstAirlineAddress] = Airline({
            name: firstAirlineName,
            hasPaid: false,
            isRegistered: true
        });

        //push to the array
        registeredAirlines.push(firstAirlineAddress);
    }

    function deauthorizeContract(address contractAddress)
        external
        requireContractOwner
    {
        delete authorizedContracts[contractAddress];
    }

    function authorizeContract(address contractAddress)
        external
        requireContractOwner
    {
        authorizedContracts[contractAddress] = 1;
    }

    /********************************************************************************************/
    /*                                       MODIFIERS                                 */
    /********************************************************************************************/

    modifier requireIsOperational() {
        require(isOperational(), "Contract is currently not operational");
        _;
    }

    /**
     * @dev Modifier that requires the "ContractOwner" account to be the function caller
     */
    modifier requireContractOwner() {
        require(msg.sender == contractOwner, "Caller is not contract owner");
        _;
    }

    /**
     * @dev Modifier that requires airline to be paid
     */
    modifier requireHasAirlinePaid(address airline) {
        require(
            this.isPaidAirline(airline),
            "Only existing and paid airlines are allowed to participate"
        );
        _;
    }

    /**
     * @dev Modifier that requires function caller to be authorized
     */
    modifier requireIsContractAuthorized() {
        require(
            authorizedContracts[msg.sender] == 1,
            "Not an authorized contract"
        );
        _;
    }

    /**
     * @dev Modifier that requires address to be valid
     */
    modifier requireValidAddress(address addr) {
        require(addr != address(0), "require a valid address");
        _;
    }

    modifier requireIsAirlineRegistered(address addr) {
        require(
            !airlines[addr].isRegistered,
            "Airline has already been registered"
        );
        _;
    }

    modifier requirePendingPaymentAmount(address passenger) {
        require(
            pendingPayments[passenger] > 0,
            "Fund is not enought for withdrawal"
        );
        _;
    }

    modifier isNewStatus(bool status) {
        require(status != operational, "status must be different");
        _;
    }

    modifier isDupCall() {
        bool isDuplicate = false;

        for (uint256 i = 0; i < multiConsensus.length; i++) {
            if (multiConsensus[i] == msg.sender) {
                isDuplicate = true;
                break;
            }
        }

        require(!isDuplicate, "Caller has already called this function.");
        _;
    }

    /********************************************************************************************/
    /*                                       EVENT DEFINITIONS                                  */
    /********************************************************************************************/

    event AirlinePaid(string name, address addr);
    event AirlineRegistered(string name, address addr);
    event InsureeCredited(address passenger, uint256 amount);
    event InsuranceBought(
        address airline,
        string flight,
        uint256 timestamp,
        address passenger,
        uint256 amount,
        uint256 multiplier
    );
    event FlightStatusUpdated(
        address airline,
        string flight,
        uint256 timestamp,
        uint8 statusCode
    );
    event AccountWithdrawn(address passenger, uint256 amount);
    event FlightRegistered(
        address airline,
        string flight,
        string from,
        string to,
        uint256 timestamp
    );

    /********************************************************************************************/
    /*                                       UTILITY FUNCTIONS                                  */
    /********************************************************************************************/

    function isOperational() public view returns (bool) {
        return operational;
    }

    function getAirlineName(address airline)
        external
        view
        returns (string memory)
    {
        return airlines[airline].name;
    }

    function isRegisteredAirline(address airline) external view returns (bool) {
        return airlines[airline].isRegistered;
    }

    function isPaidAirline(address airline) external view returns (bool) {
        return airlines[airline].hasPaid;
    }

    function getRegisteredAirlines() external view returns (address[] memory) {
        return registeredAirlines;
    }

    function isInsured(bytes32 key, address passenger)
        external
        view
        returns (bool)
    {
        Insurance[] memory insuredPassengers = passengersInsurancePerFlight[
            key
        ];

        for (uint256 i = 0; i < insuredPassengers.length; i++) {
            if (insuredPassengers[i].passenger == passenger) {
                return true;
            }
        }

        return false;
    }

    function isRegisteredFlight(bytes32 key) external view returns (bool) {
        return flights[key].isRegistered;
    }

    /**
     * @dev Return the pending payment
     */
    function getPendingPaymentAmount(address passenger)
        external
        view
        returns (uint256)
    {
        return pendingPayments[passenger];
    }

    function setOperatingStatus(bool status)
        external
        isDupCall
        isNewStatus(status)
        requireContractOwner
    {
        multiConsensus.push(msg.sender);

        if (multiConsensus.length >= MULTI_CONSENSUS_COUNT) {
            operational = status;
            multiConsensus = new address[](0);
        }
    }

    /********************************************************************************************/
    /*                                     SMART CONTRACT FUNCTIONS                             */
    /********************************************************************************************/

    /**
     * @dev Add an airline to the registration queue
     *      Can only be called from FlightSuretyApp contract
     */
    function registerAirline(string name, address addr)
        external
        requireIsOperational
        requireIsContractAuthorized
        requireValidAddress(addr)
        requireIsAirlineRegistered(addr)
        returns (bool success)
    {
        airlines[addr] = Airline({
            name: name,
            hasPaid: false,
            isRegistered: true
        });

        registeredAirlines.push(addr);
        return true;
    }

    /**
     * @dev Submit funding for airline
     */
    function payAirline(address addr)
        external
        requireIsOperational
        requireIsContractAuthorized
    {
        airlines[addr].hasPaid = true;
        emit AirlinePaid(airlines[addr].name, addr);
    }

    /**
     * @dev Register a flight
     */
    function registerFlight(
        address airline,
        string flight,
        string from,
        string to,
        uint256 timestamp,
        bytes32 key
    )
        external
        requireIsOperational
        requireIsContractAuthorized
        requireValidAddress(airline)
        requireHasAirlinePaid(airline)
    {
        require(
            !flights[key].isRegistered,
            "AirlineFlight is registered already"
        );

        flights[key] = AirlineFlight({
            isRegistered: true,
            airline: airline,
            flight: flight,
            statusCode: 0,
            flightTimeStamp: timestamp,
            from: from,
            to: to
        });

        registeredFlights.push(key);

        emit FlightRegistered(airline, flight, from, to, timestamp);
    }

    /**
     * @dev Buy insurance for a flight
     */
    function purchase(
        bytes32 key,
        address passenger,
        uint256 amount,
        uint256 multiplier
    ) external requireIsOperational requireIsContractAuthorized {
        passengersInsurancePerFlight[key].push(
            Insurance({
                isCredited: false,
                amount: amount,
                multiplier: multiplier,
                passenger: passenger
            })
        );
    }

    /**
     * @dev Credits payouts to insurees
     */
    function payInsureeBack(bytes32 flightKey)
        internal
        requireIsOperational
        requireIsContractAuthorized
    {
        for (uint256 index = 0; index < passengersInsurancePerFlight[flightKey].length; index++) 
        {
            Insurance memory insurance = passengersInsurancePerFlight[flightKey][index];

            if (insurance.isCredited == false) 
            {
                insurance.isCredited = true;

                uint256 amount = insurance.amount.mul(insurance.multiplier).div(100);

                pendingPayments[insurance.passenger] += amount;

                emit InsureeCredited(insurance.passenger, amount);
            }
        }
    }

    function processFlightStatus(bytes32 flightKey, uint8 statusCode)
        external
        requireIsOperational
        requireIsContractAuthorized
    {
        if (flights[flightKey].statusCode == STATUS_CODE_UNKNOWN) {
            flights[flightKey].statusCode = statusCode;

            if (statusCode == STATUS_CODE_LATE) {
                payInsureeBack(flightKey);
            }
        }
    }

    /**
     * @dev Transfers eligible payout funds to insuree
     */

    function refund(address passenger)
        external
        requireIsOperational
        requireIsContractAuthorized
        requirePendingPaymentAmount(passenger)
    {
        uint256 amount = pendingPayments[passenger];
        pendingPayments[passenger] = 0;
        address(uint160(passenger)).transfer(amount);
        emit AccountWithdrawn(passenger, amount);
    }    

    function fund() public payable requireIsOperational {}

    /**
     * @dev Fallback function for funding smart contract.
     */
    function() external payable {
        fund();
    }
}
