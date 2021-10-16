pragma solidity ^0.4.24;
import "../node_modules/openzeppelin-solidity/contracts/math/SafeMath.sol";

/************************************************** */
/* FlightSurety Smart Contract                      */
/************************************************** */
contract FlightSuretyApp {
    using SafeMath for uint256;

    // contract Owner
    address private contractOwner;

    mapping(address => address[]) private registeredAirlinesWithVotes;

    // All airlines can register, but to vote other airline, they need to pay 10 ether
    uint256 constant AIRLINE_FEE = 10 ether;

    // Insurance in percentage
    uint256 constant INSURANCE_PERCENTAGE_MULTIPLIER = 150;

    // Registration of fifth and subsequent airlines requires consensus of 50% of registered airlines
    uint256 constant REGISTER_AIRLINE_REGISTRATION_THRESHOLD = 4;
    uint256 constant MULTI_SIG_CONSENSUS_DIVISOR = 2;

    // Passenger Payment: Passengers may pay up to 1 ether for purchasing flight insurance
    uint256 constant MAX_PASSENGER_INSURANCE_VALUE = 1 ether;

    FlightSuretyData flightSuretyData;

    /********************************************************************************************/
    /*                                       CONSTRUCTOR                                        */
    /********************************************************************************************/

    /**
     * @dev Contract constructor
     *
     */
    constructor(address dataContract) public {
        contractOwner = msg.sender;

        flightSuretyData = FlightSuretyData(dataContract);
    }

    /********************************************************************************************/
    /*                                       FUNCTION MODIFIERS                                 */
    /********************************************************************************************/

    /**
     * @dev Modifier that requires the "operational" boolean variable to be "true"
     *      This is used on all state changing functions to pause the contract in
     *      the event there is an issue that needs to be fixed
     */
    modifier requireIsOperational() {
        // Modify to call data contract's status
        require(
            flightSuretyData.isOperational(),
            "Contract is currently not validoperational"
        );
        _;
    }

    /**
     * @dev Modifier that requires the "ContractOwner" account to be the function caller
     */
    modifier requireContractOwner() {
        require(msg.sender == contractOwner, "Caller is not the owner");
        _;
    }

    /**
     * @dev Modifier that requires airline to be paid
     */
    modifier requireAirlineIsPaid(address airline) {
        require(flightSuretyData.isPaidAirline(airline), "Only paid airlines are allowed");
        _;
    }

    /**
     * @dev Modifier that requires registered airlined to be unique
     */
    modifier requireNonDupAirline(address addr) {
        bool dup = false;

        for (uint256 i = 0; i < registeredAirlinesWithVotes[addr].length; i++) {
            if (registeredAirlinesWithVotes[addr][i] == msg.sender) {
                dup = true;
                break;
            }
        }

        require(!dup, "this is a duplicated airline.");
        _;
    }

    /**
     * @dev Modifier that requires address to be valid
     */
    modifier requireValidAddress(address addr) {
        require(addr != address(0), "Invalid address");
        _;
    }

    modifier requireFee() {
        require(msg.value == AIRLINE_FEE, "invalid funding value submitted");
        _;
    }

    modifier requireInsuranceFee() {
        require(
            msg.value > 0 && msg.value <= MAX_PASSENGER_INSURANCE_VALUE,
            "Incorrect insurance fee"
        );
        _;
    }
    
    modifier requireFlightTobeRegistered(
        address airline,
        string  flight,
        uint256 timestamp // requireIsOperational
    )
    {
          require(
            flightSuretyData.isRegisteredFlight(getFlightKey(airline, flight, timestamp)),
            "Flight is not registered"
        );
        _;
    }

    modifier requireOnlyPassenger(        
        string  flight,
        uint256 timestamp // requireIsOperational
    )
    {
          require(
            !flightSuretyData.isInsured(getFlightKey(msg.sender, flight, timestamp), msg.sender),
            "This insurance has been bought before by the same passenger"
        );
        _;
    }


    /********************************************************************************************/
    /*                                       EVENT DEFINITIONS                                  */
    /********************************************************************************************/

    event AirlineRegistered(
        string name,
        address addr,
        bool success,
        uint256 votes
    );
    event AirlinePaid(address addr, uint256 amount);

    event FlightRegistered(
        address airline,
        string flight,
        string from,
        string to,
        uint256 timestamp
    );
    event InsurancePurchased(
        address airline,
        string flight,
        uint256 timestamp,
        address passenger,
        uint256 amount,
        uint256 multiplier
    );

    /********************************************************************************************/
    /*                                       UTILITY FUNCTIONS                                  */
    /********************************************************************************************/

    function isOperational() external view returns (bool) {
        return flightSuretyData.isOperational();
    }

    /********************************************************************************************/
    /*                                     SMART CONTRACT FUNCTIONS                             */
    /********************************************************************************************/

    /**
     * @dev Add an airline to the registration queue
     *
     */
    function registerAirline(string memory name, address addr)
        public
        requireValidAddress(addr)
        requireAirlineIsPaid(msg.sender)
        requireIsOperational
        requireNonDupAirline(addr)
        returns (bool success, uint256 votes)
    {
        bool result = false;

        address[] memory registeredAirlines = flightSuretyData.getRegisteredAirlines();

        // first airline company
        if (
            registeredAirlines.length == 0 || registeredAirlines.length < REGISTER_AIRLINE_REGISTRATION_THRESHOLD
        ) 
        {
            result = flightSuretyData.registerAirline(name, addr);
        } 
        else 
        {
            registeredAirlinesWithVotes[addr].push(msg.sender);

            if (
                registeredAirlinesWithVotes[addr].length >=
                registeredAirlines.length.div(MULTI_SIG_CONSENSUS_DIVISOR)
            ) {
                result = flightSuretyData.registerAirline(name, addr);

                registeredAirlinesWithVotes[addr] = new address[](0);
            }
        }

        emit AirlineRegistered(
            name,
            addr,
            result,
            registeredAirlinesWithVotes[addr].length
        );

        return (result, registeredAirlinesWithVotes[addr].length);
    }

    /**
     * @dev Register a future flight for insuring.
     */
    function registerFlight(        
        string  flight,
        string from,
        string to,
        uint256 timestamp
    )
        external
        requireIsOperational
        requireValidAddress(msg.sender)
        requireAirlineIsPaid(msg.sender)
    {
        bytes32 flightKey = getFlightKey(msg.sender, flight, timestamp);
        flightSuretyData.registerFlight(msg.sender, flight, from, to, timestamp, flightKey);
        emit FlightRegistered(msg.sender, flight, from, to, timestamp);
    }


    function isRegisteredFlight(address airline, string  flight, uint256 timestamp) 
    public view returns (bool)
    {   
        return flightSuretyData.isRegisteredFlight(getFlightKey(airline, flight, timestamp));
    }



 function isInsured(address passenger, address airline, string  flight, uint256 timestamp) 
 requireIsOperational  
 public view returns (bool) 
{
    return flightSuretyData.isInsured(getFlightKey(passenger, flight, timestamp), passenger);
}


    function purchaseInsurance(
        address airline,
        string  flight,
        uint256 timestamp // requireIsOperational
    ) external payable 
        requireInsuranceFee()
        requireFlightTobeRegistered(airline, flight, timestamp)
        requireOnlyPassenger(flight, timestamp)
    {
        // Cast address to payable address
        address(uint160(address(flightSuretyData))).transfer(msg.value);
        bytes32 flightKey = getFlightKey(msg.sender, flight, timestamp);

        flightSuretyData.purchase(
            flightKey,
            msg.sender,
            msg.value,
            INSURANCE_PERCENTAGE_MULTIPLIER
        );

        emit InsurancePurchased(
            airline,
            flight,
            timestamp,
            msg.sender,
            msg.value,
            INSURANCE_PERCENTAGE_MULTIPLIER
        );
    }

    /**
     * @dev Submit funding for airline
     */
    function payAirline() external payable requireIsOperational requireFee {
        // Cast address to payable address
        address(uint160(address(flightSuretyData))).transfer(msg.value);
        flightSuretyData.payAirline(msg.sender);
        emit AirlinePaid(msg.sender, msg.value);
    }

    /**
     * @dev Called after oracle has updated flight status
     */
    function processFlightStatus(        
        bytes32 key,
        uint8 statusCode
    ) internal requireIsOperational {
        flightSuretyData.processFlightStatus(
            key,
            statusCode
        );
    }

    // Generate a request for oracles to fetch flight information
    function fetchFlightStatus(
        address airline,
        string  flight,
        uint256 timestamp
    ) external {
        uint8 index = getRandomIndex(msg.sender);

        // Generate a unique key for storing the request
        bytes32 key = keccak256(abi.encodePacked(index, airline, flight, timestamp));

        oracleResponses[key] = ResponseInfo({
            requester: msg.sender,
            isOpen: true
        });

        emit OracleRequest(index, airline, flight, timestamp);
    }

    function getPendingPaymentAmount(address passenger) external returns (uint256) 
    {
        return flightSuretyData.getPendingPaymentAmount(passenger);
    }  

    function refund() requireIsOperational external
    {
        return flightSuretyData.refund(msg.sender);
    }

    /********************************************************************************************/
    /*                                     ORACLE MANAGEMENT                                    */
    /********************************************************************************************/

    modifier requireOracleRegistrationFee() {
        require(msg.value >= REGISTRATION_FEE, "Registration fee is required");
        _;
    }

    uint8 private nonce = 0;
    uint256 public constant REGISTRATION_FEE = 1 ether;
    uint256 private constant MIN_RESPONSES = 3;

    struct ResponseInfo {
        address requester;
        bool isOpen;
        mapping(uint8 => address[]) responses;
    }

    mapping(bytes32 => ResponseInfo) private oracleResponses;

    struct Oracle {
        bool isRegistered;
        uint8[3] indexes;
    }

    mapping(address => Oracle) private oracles;

    event FlightStatusInfo(
        address airline,
        string flight,
        uint256 timestamp,
        uint8 status
    );

    event OracleReport(
        address airline,
        string flight,
        uint256 timestamp,
        uint8 status
    );

    event OracleRequest(
        uint8 index,
        address airline,
        string flight,
        uint256 timestamp
    );

    function getMyIndexes()
        external
        view
        requireIsOperational
        returns (uint8[3] memory)
    {
        require(
            oracles[msg.sender].isRegistered,
            "Not registered as an oracle"
        );
        return oracles[msg.sender].indexes;
    }

    // Register an oracle with the contract
    function registerOracle()
        external
        payable
        requireOracleRegistrationFee
        requireIsOperational
    {
        uint8[3] memory indexes = generateIndexes(msg.sender);
        oracles[msg.sender] = Oracle({isRegistered: true, indexes: indexes});
    }

    function submitOracleResponse(
        uint8 index,
        address airline,
        string  flight,
        uint256 timestamp,
        uint8 statusCode
    ) external requireIsOperational {
        require(
            (oracles[msg.sender].indexes[0] == index) ||
                (oracles[msg.sender].indexes[1] == index) ||
                (oracles[msg.sender].indexes[2] == index),
            "Index does not match oracle request"
        );

        bytes32 key = keccak256(
            abi.encodePacked(index, airline, flight, timestamp)
        );
        require(
            oracleResponses[key].isOpen,
            "Flight or timestamp do not match oracle request"
        );

        oracleResponses[key].responses[statusCode].push(msg.sender);        
        emit OracleReport(airline, flight, timestamp, statusCode);

        if (oracleResponses[key].responses[statusCode].length >= 1) 
        {
            emit FlightStatusInfo(airline, flight, timestamp, statusCode);
            bytes32 flightKey = getFlightKey(msg.sender, flight, timestamp);                        
            processFlightStatus(key,statusCode);
        }
    }

    function getFlightKey(
        address airline,
        string memory flight,
        uint256 timestamp
    ) internal pure returns (bytes32) {
        return keccak256(abi.encodePacked(airline, flight, timestamp));
    }
    
    function generateIndexes(address account)
        internal
        returns (uint8[3] memory)
    {
        uint8[3] memory indexes;
        indexes[0] = getRandomIndex(account);

        indexes[1] = indexes[0];
        while (indexes[1] == indexes[0]) {
            indexes[1] = getRandomIndex(account);
        }

        indexes[2] = indexes[1];
        while ((indexes[2] == indexes[0]) || (indexes[2] == indexes[1])) {
            indexes[2] = getRandomIndex(account);
        }

        return indexes;
    }

    function getRandomIndex(address account) internal returns (uint8) {
        uint8 maxValue = 10;
        uint8 random = uint8(
            uint256(
                keccak256(
                    abi.encodePacked(blockhash(block.number - nonce++), account)
                )
            ) % maxValue
        );

        if (nonce > 250) {
            nonce = 0; // Can only fetch blockhashes for last 256 blocks so we adapt
        }

        return random;
    }
}

// FlightSurety data contract interface
interface FlightSuretyData {
    function isOperational() external view returns (bool);

    function isPaidAirline(address airline) external view returns (bool);

    function getRegisteredAirlines() external view returns (address[] memory);

    function setOperatingStatus(bool mode) external;

    function registerAirline(string name, address addr) external returns (bool);

    function isRegisteredAirline(address airline) external view returns (bool);

    function payAirline(address addr) external payable;

    function processFlightStatus(bytes32 flightKey, uint8 statusCode) external;   

    function registerFlight(
        address airline,
        string  flight,
        string from,
        string to,
        uint256 timestamp,
        bytes32 key
    ) external;

    function isRegisteredFlight(
        bytes32 key
    ) external view returns (bool);

    // Passengers
    function purchase(
        bytes32 key,
        address passenger,
        uint256 amount,
        uint256 multiplier
    ) external payable;

    function isInsured(
        bytes32 key,
        address passenger        
    ) external view returns (bool);

    function refund(address passenger) external;    
    function getPendingPaymentAmount(address passenger) external view returns (uint256);
}
