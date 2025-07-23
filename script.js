




// Match data structure
let matchData = {
    team1: {
        name: "",
        players: [],
        batting: [],
        bowling: [],
        totalRuns: 0,
        wickets: 0,
        overs: 0,
        balls: 0,
        extras: 0,
        wicketkeeper: "",
        maxBowlerOvers: 0
    },
    team2: {
        name: "",
        players: [],
        batting: [],
        bowling: [],
        totalRuns: 0,
        wickets: 0,
        overs: 0,
        balls: 0,
        extras: 0,
        wicketkeeper: "",
        maxBowlerOvers: 0
    },
    currentInnings: 1,
    totalOvers: 20,
    powerplayOvers: 6,
    matchType: "limited",
    history: [],
    timeline: [],
    matchStarted: false,
    matchEnded: false,
    currentOver: [],
    partnership: {
        runs: 0,
        balls: 0,
        batsman1: "",
        batsman2: ""
    }
};

// DOM elements
const setupSection = document.getElementById('setup-section');
const matchSection = document.getElementById('match-section');
const summarySection = document.getElementById('summary-section');
const bowlerModal = document.getElementById('bowler-modal');
const newBowlerSelect = document.getElementById('new-bowler-select');
const confirmBowlerChange = document.getElementById('confirm-bowler-change');
const modalClose = document.querySelector('.close');

// Initialize the app
document.addEventListener('DOMContentLoaded', function() {
    // Check for saved match
    const savedMatch = localStorage.getItem('cricketMatchData');
    if (savedMatch) {
        try {
            const parsedData = JSON.parse(savedMatch);
            if (parsedData.matchStarted) {
                matchData = parsedData;
                if (matchData.matchEnded) {
                    showSummary();
                } else {
                    startMatch();
                }
            }
        } catch (e) {
            console.error("Error loading saved match:", e);
        }
    }

    // Setup event listeners
    setupEventListeners();
});

function setupEventListeners() {
    // Add player buttons
    document.getElementById('add-team1-player').addEventListener('click', () => addPlayer('team1'));
    document.getElementById('add-team2-player').addEventListener('click', () => addPlayer('team2'));

    // Start match button
    document.getElementById('start-match').addEventListener('click', startMatchSetup);

    // Load match button
    document.getElementById('load-match').addEventListener('click', loadMatch);

    // Run buttons
    document.querySelectorAll('.run-btn').forEach(btn => {
        btn.addEventListener('click', function() {
            addRuns(parseInt(this.getAttribute('data-runs')));
        });
    });

    // Extra buttons
    document.querySelectorAll('.extra-btn').forEach(btn => {
        btn.addEventListener('click', function() {
            addExtra(this.getAttribute('data-extra'));
        });
    });

    // Wicket buttons
    document.querySelectorAll('.wicket-btn').forEach(btn => {
        btn.addEventListener('click', function() {
            addWicket(this.getAttribute('data-type'));
        });
    });

    // End innings button
    document.getElementById('end-innings').addEventListener('click', endInnings);

    // Undo button
    document.getElementById('undo-btn').addEventListener('click', undoLastAction);

    // New match button
    document.getElementById('new-match').addEventListener('click', resetMatch);

    // Save match button
    document.getElementById('save-match').addEventListener('click', saveMatch);

    // Export match button
    document.getElementById('export-match').addEventListener('click', exportMatch);

    // Change strike button
    document.getElementById('change-strike').addEventListener('click', rotateStrike);

    // Change bowler button
    document.getElementById('change-bowler').addEventListener('click', showBowlerModal);

    // Modal events
    confirmBowlerChange.addEventListener('click', changeBowler);
    modalClose.addEventListener('click', () => bowlerModal.style.display = 'none');
    window.addEventListener('click', (event) => {
        if (event.target === bowlerModal) {
            bowlerModal.style.display = 'none';
        }
    });
}

function addPlayer(team) {
    const container = document.getElementById(`${team}-players`);
    const playerDiv = document.createElement('div');
    playerDiv.className = 'flex gap-2 items-center';
    playerDiv.innerHTML = `
        <input type="text" class="flex-1 px-3 py-2 border border-gray-300 rounded-md" placeholder="Player name">
        <div class="flex items-center gap-2">
            <label class="text-xs text-gray-500">WK</label>
            <input type="checkbox" class="wicketkeeper">
        </div>
        <button class="remove-player px-2 py-1 bg-red-100 text-red-700 rounded-md text-sm">×</button>
    `;
    container.appendChild(playerDiv);

    // Add event listener to remove button
    playerDiv.querySelector('.remove-player').addEventListener('click', function() {
        container.removeChild(playerDiv);
    });
}

function startMatchSetup() {
    // Get team names
    matchData.team1.name = document.getElementById('team1-name').value || 'Team 1';
    matchData.team2.name = document.getElementById('team2-name').value || 'Team 2';

    // Get players for team 1
    matchData.team1.players = [];
    matchData.team1.wicketkeeper = "";
    document.querySelectorAll('#team1-players .wicketkeeper').forEach((checkbox, index) => {
        const input = checkbox.parentElement.parentElement.querySelector('input[type="text"]');
        if (input.value.trim()) {
            matchData.team1.players.push(input.value.trim());
            if (checkbox.checked) {
                matchData.team1.wicketkeeper = input.value.trim();
            }
        }
    });

    // Get players for team 2
    matchData.team2.players = [];
    matchData.team2.wicketkeeper = "";
    document.querySelectorAll('#team2-players .wicketkeeper').forEach((checkbox, index) => {
        const input = checkbox.parentElement.parentElement.querySelector('input[type="text"]');
        if (input.value.trim()) {
            matchData.team2.players.push(input.value.trim());
            if (checkbox.checked) {
                matchData.team2.wicketkeeper = input.value.trim();
            }
        }
    });

    // Validate at least 2 players per team
    if (matchData.team1.players.length < 2 || matchData.team2.players.length < 2) {
        alert('Each team must have at least 2 players');
        return;
    }

    // Validate at least one wicketkeeper per team
    if (!matchData.team1.wicketkeeper || !matchData.team2.wicketkeeper) {
        alert('Each team must have one wicketkeeper selected');
        return;
    }

    // Get match settings
    matchData.totalOvers = parseInt(document.getElementById('total-overs').value) || 20;
    matchData.powerplayOvers = parseInt(document.getElementById('powerplay-overs').value) || 6;
    matchData.matchType = document.getElementById('match-type').value;

    // Calculate max overs per bowler (1/5th of total overs for limited overs, no limit for test)
    const maxBowlerOvers = matchData.matchType === 'test' ? matchData.totalOvers : Math.ceil(matchData.totalOvers / 5);
    matchData.team1.maxBowlerOvers = maxBowlerOvers;
    matchData.team2.maxBowlerOvers = maxBowlerOvers;

    // Initialize batting and bowling data
    initializeTeamData();

    // Set initial strikers and bowlers
    matchData.team1.batting[0].striker = true;
    matchData.team1.batting[1].striker = true;
    matchData.team2.bowling[0].isBowling = true;

    // Initialize partnership
    matchData.partnership = {
        runs: 0,
        balls: 0,
        batsman1: matchData.team1.batting[0].name,
        batsman2: matchData.team1.batting[1].name
    };

    matchData.matchStarted = true;
    matchData.matchEnded = false;
    matchData.currentInnings = 1;
    matchData.currentOver = [];

    // Add to timeline
    addTimelineEvent("Match started. " + matchData.team1.name + " batting first.");

    // Save match data
    saveMatchToLocalStorage();

    // Start the match
    startMatch();
}

function initializeTeamData() {
    // Team 1 batting
    matchData.team1.batting = matchData.team1.players.map(player => ({
        name: player,
        runs: 0,
        balls: 0,
        fours: 0,
        sixes: 0,
        out: false,
        outType: "",
        outBowler: "",
        outFielder: "",
        striker: false,
        isWicketkeeper: player === matchData.team1.wicketkeeper
    }));

    // Team 2 bowling
    matchData.team2.bowling = matchData.team2.players.map(player => ({
        name: player,
        overs: 0,
        maidens: 0,
        runs: 0,
        wickets: 0,
        balls: 0,
        isBowling: false,
        isWicketkeeper: player === matchData.team2.wicketkeeper,
        oversBowled: 0
    }));

    // Team 2 batting
    matchData.team2.batting = matchData.team2.players.map(player => ({
        name: player,
        runs: 0,
        balls: 0,
        fours: 0,
        sixes: 0,
        out: false,
        outType: "",
        outBowler: "",
        outFielder: "",
        striker: false,
        isWicketkeeper: player === matchData.team2.wicketkeeper
    }));

    // Team 1 bowling
    matchData.team1.bowling = matchData.team1.players.map(player => ({
        name: player,
        overs: 0,
        maidens: 0,
        runs: 0,
        wickets: 0,
        balls: 0,
        isBowling: false,
        isWicketkeeper: player === matchData.team1.wicketkeeper,
        oversBowled: 0
    }));
}

function startMatch() {
    setupSection.classList.add('hidden');
    matchSection.classList.remove('hidden');
    summarySection.classList.add('hidden');

    updateMatchDisplay();
}

function updateMatchDisplay() {
    const battingTeam = matchData.currentInnings === 1 ? matchData.team1 : matchData.team2;
    const bowlingTeam = matchData.currentInnings === 1 ? matchData.team2 : matchData.team1;

    // Update score display
    document.getElementById('current-innings').textContent = 
        matchData.currentInnings === 1 ? '1st Innings' : '2nd Innings';
    document.getElementById('score-display').textContent = 
        `${battingTeam.totalRuns}/${battingTeam.wickets} (${Math.floor(battingTeam.balls / 6)}.${battingTeam.balls % 6})`;
    
    // Update run rate
    const oversCompleted = battingTeam.balls / 6;
    const runRate = oversCompleted > 0 ? (battingTeam.totalRuns / oversCompleted).toFixed(2) : 0;
    document.getElementById('run-rate').textContent = runRate;
    
    // Update required run rate if 2nd innings
    if (matchData.currentInnings === 2) {
        const runsNeeded = matchData.team1.totalRuns - battingTeam.totalRuns + 1;
        const ballsRemaining = matchData.totalOvers * 6 - battingTeam.balls;
        const requiredRate = ballsRemaining > 0 ? ((runsNeeded / ballsRemaining) * 6).toFixed(2) : 0;
        document.getElementById('req-rate').textContent = requiredRate;
    } else {
        document.getElementById('req-rate').textContent = '-';
    }

    // Update team names
    document.getElementById('batting-team-name').textContent = battingTeam.name;
    document.getElementById('bowling-team-name').textContent = bowlingTeam.name;

    // Update partnership
    document.getElementById('partnership-runs').textContent = matchData.partnership.runs;
    document.getElementById('partnership-balls').textContent = matchData.partnership.balls;

    // Update current over display
    document.getElementById('current-over-display').textContent = 
        `${Math.floor(bowlingTeam.balls / 6)}.${bowlingTeam.balls % 6}`;

    // Update batting table
    const battingTable = document.getElementById('batting-team-players');
    battingTable.innerHTML = '';
    battingTeam.batting.forEach(player => {
        const row = document.createElement('tr');
        row.className = `border-b border-gray-100 ${player.striker ? 'active-player' : ''}`;
        row.innerHTML = `
            <td class="py-2">${player.name} ${player.isWicketkeeper ? '(wk)' : ''} ${player.out ? `(${player.outType}${player.outBowler ? ' b ' + player.outBowler : ''}${player.outFielder ? ' c ' + player.outFielder : ''})` : player.striker ? '*' : ''}</td>
            <td class="py-2 text-right">${player.runs}</td>
            <td class="py-2 text-right">${player.balls}</td>
            <td class="py-2 text-right">${player.fours}</td>
            <td class="py-2 text-right">${player.sixes}</td>
            <td class="py-2 text-right">${player.balls > 0 ? ((player.runs / player.balls) * 100).toFixed(1) : '-'}</td>
        `;
        battingTable.appendChild(row);
    });

    // Update bowling table
    const bowlingTable = document.getElementById('bowling-team-players');
    bowlingTable.innerHTML = '';
    bowlingTeam.bowling.forEach(player => {
        if (player.balls > 0 || player.isBowling) {
            const row = document.createElement('tr');
            row.className = `border-b border-gray-100 ${player.isBowling ? 'active-player' : ''}`;
            row.innerHTML = `
                <td class="py-2">${player.name} ${player.isWicketkeeper ? '(wk)' : ''} ${player.oversBowled >= matchData.currentInnings === 1 ? matchData.team2.maxBowlerOvers : matchData.team1.maxBowlerOvers ? '(Max)' : ''}</td>
                <td class="py-2 text-right">${Math.floor(player.balls / 6)}.${player.balls % 6}</td>
                <td class="py-2 text-right">${player.maidens}</td>
                <td class="py-2 text-right">${player.runs}</td>
                <td class="py-2 text-right">${player.wickets}</td>
                <td class="py-2 text-right">${player.balls > 0 ? (player.runs / (player.balls / 6)).toFixed(1) : '-'}</td>
            `;
            bowlingTable.appendChild(row);
        }
    });

    // Update fall of wickets
    const fallOfWickets = document.getElementById('fall-of-wickets');
    fallOfWickets.innerHTML = '';
    
    const wickets = [];
    battingTeam.batting.forEach(player => {
        if (player.out) {
            wickets.push({
                runs: battingTeam.totalRuns - (player.runs || 0),
                player: player.name,
                description: `${player.name} ${player.outType}${player.outBowler ? ' b ' + player.outBowler : ''}${player.outFielder ? ' c ' + player.outFielder : ''}`
            });
        }
    });
    
    if (wickets.length > 0) {
        // Sort wickets by runs
        wickets.sort((a, b) => a.runs - b.runs);
        
        wickets.forEach((wicket, index) => {
            const div = document.createElement('div');
            div.className = 'mb-1 last:mb-0';
            div.textContent = `${index + 1}. ${wicket.runs}-${wicket.player}: ${wicket.description}`;
            fallOfWickets.appendChild(div);
        });
    } else {
        fallOfWickets.textContent = 'No wickets fallen yet';
    }

    // Update current over balls
    const currentOverBalls = document.getElementById('current-over-balls');
    currentOverBalls.innerHTML = '';
    
    matchData.currentOver.forEach(ball => {
        const span = document.createElement('span');
        span.className = `ball-dot ball-${ball.type}`;
        span.title = ball.description || `${ball.type.toUpperCase()}`;
        currentOverBalls.appendChild(span);
    });

    // Update striker and non-striker dropdowns
    const strikerSelect = document.getElementById('striker');
    const nonStrikerSelect = document.getElementById('non-striker');
    strikerSelect.innerHTML = '';
    nonStrikerSelect.innerHTML = '';

    battingTeam.batting.forEach(player => {
        if (!player.out) {
            const option = document.createElement('option');
            option.value = player.name;
            option.textContent = player.name;
            option.selected = player.striker;
            strikerSelect.appendChild(option.cloneNode(true));
            nonStrikerSelect.appendChild(option);
        }
    });

    // Update current bowler dropdown
    const bowlerSelect = document.getElementById('current-bowler');
    bowlerSelect.innerHTML = '';
    bowlingTeam.bowling.forEach(player => {
        if (!player.isWicketkeeper && (player.oversBowled < (matchData.currentInnings === 1 ? matchData.team2.maxBowlerOvers : matchData.team1.maxBowlerOvers) || player.isBowling)) {
            const option = document.createElement('option');
            option.value = player.name;
            option.textContent = player.name;
            option.selected = player.isBowling;
            bowlerSelect.appendChild(option);
        }
    });
}

function addRuns(runs) {
    const battingTeam = matchData.currentInnings === 1 ? matchData.team1 : matchData.team2;
    const bowlingTeam = matchData.currentInnings === 1 ? matchData.team2 : matchData.team1;

    // Check if innings has ended (target reached in 2nd innings)
    if (matchData.currentInnings === 2 && battingTeam.totalRuns + runs > matchData.team1.totalRuns) {
        // Adjust runs to exact target
        runs = matchData.team1.totalRuns - battingTeam.totalRuns;
        if (runs < 0) runs = 0; // Shouldn't happen but just in case
    }

    // Find current striker
    const striker = battingTeam.batting.find(p => p.striker);
    if (!striker || striker.out) return;

    // Save state for undo
    matchData.history.push({
        type: 'runs',
        runs: runs,
        striker: striker.name,
        bowler: bowlingTeam.bowling.find(p => p.isBowling)?.name || '',
        partnershipRuns: matchData.partnership.runs,
        partnershipBalls: matchData.partnership.balls
    });

    // Update striker stats
    striker.runs += runs;
    striker.balls++;
    if (runs === 4) striker.fours++;
    if (runs === 6) striker.sixes++;

    // Update team stats
    battingTeam.totalRuns += runs;
    battingTeam.balls++;

    // Update partnership
    matchData.partnership.runs += runs;
    matchData.partnership.balls++;

    // Update bowler stats
    const currentBowler = bowlingTeam.bowling.find(p => p.isBowling);
    if (currentBowler) {
        currentBowler.runs += runs;
        currentBowler.balls++;
        
        // Check for maiden over (only if no runs scored in completed over)
        if (currentBowler.balls % 6 === 0) {
            const overRuns = matchData.currentOver.slice(-6).reduce((sum, ball) => {
                return sum + (ball.type === 'w' || ball.type === 'wd' || ball.type === 'nb' ? 0 : ball.runs || 0);
            }, 0);
            
            if (overRuns === 0) {
                currentBowler.maidens++;
            }
            currentBowler.oversBowled++;
        }
    }

    // Add ball to current over
    const commentary = document.getElementById('ball-commentary').value || "";
    matchData.currentOver.push({
        type: runs.toString(),
        runs: runs,
        striker: striker.name,
        bowler: currentBowler ? currentBowler.name : '',
        description: commentary || `${runs} run${runs !== 1 ? 's' : ''}`
    });

    // Add to timeline
    addTimelineEvent(`${striker.name} scores ${runs} run${runs !== 1 ? 's' : ''}${commentary ? ' - ' + commentary : ''}`);

    // Rotate strike if odd number of runs (except on last ball of over)
    if (runs % 2 !== 0 && (!currentBowler || currentBowler.balls % 6 !== 0)) {
        rotateStrike();
    }

    // Check for over completion
    if (currentBowler && currentBowler.balls % 6 === 0 && currentBowler.balls > 0) {
        completeOver();
    }

    // Check for innings end (all out, overs completed, or target reached in 2nd innings)
    checkInningsEnd();

    // Clear commentary
    document.getElementById('ball-commentary').value = "";

    // Update display
    updateMatchDisplay();
    saveMatchToLocalStorage();
}

function addExtra(extraType) {
    const battingTeam = matchData.currentInnings === 1 ? matchData.team1 : matchData.team2;
    const bowlingTeam = matchData.currentInnings === 1 ? matchData.team2 : matchData.team1;
    const currentBowler = bowlingTeam.bowling.find(p => p.isBowling);

    // Save state for undo
    matchData.history.push({
        type: 'extra',
        extraType: extraType,
        bowler: currentBowler?.name || '',
        partnershipRuns: matchData.partnership.runs,
        partnershipBalls: matchData.partnership.balls
    });

    // Update team stats
    let runsToAdd = 1;
    
    // For no ball, add 1 run and the next ball is a free hit (not implemented yet)
    if (extraType === 'noball') {
        runsToAdd = 1;
        battingTeam.totalRuns += runsToAdd;
        battingTeam.extras += runsToAdd;
        
        if (currentBowler) {
            currentBowler.runs += runsToAdd;
        }
        
        // No ball doesn't count as a legal delivery (don't increment ball count)
    } 
    // For wide, add 1 run and re-bowl the delivery
    else if (extraType === 'wide') {
        runsToAdd = 1;
        battingTeam.totalRuns += runsToAdd;
        battingTeam.extras += runsToAdd;
        
        if (currentBowler) {
            currentBowler.runs += runsToAdd;
        }
        
        // Wide doesn't count as a legal delivery (don't increment ball count)
    } 
    // For bye or leg bye, add runs scored (default 1) and count as a legal delivery
    else {
        battingTeam.totalRuns += runsToAdd;
        battingTeam.extras += runsToAdd;
        battingTeam.balls++;
        
        if (currentBowler) {
            currentBowler.balls++;
            
            // Check for maiden over
            if (currentBowler.balls % 6 === 0) {
                const overRuns = matchData.currentOver.slice(-6).reduce((sum, ball) => {
                    return sum + (ball.type === 'w' || ball.type === 'wd' || ball.type === 'nb' ? 0 : ball.runs || 0);
                }, 0);
                
                if (overRuns === 0) {
                    currentBowler.maidens++;
                }
                currentBowler.oversBowled++;
            }
        }
    }

    // Add ball to current over
    const commentary = document.getElementById('ball-commentary').value || "";
    const extraName = {
        'wide': 'WD',
        'noball': 'NB',
        'bye': 'B',
        'legbye': 'LB'
    }[extraType];
    
    matchData.currentOver.push({
        type: extraType,
        runs: runsToAdd,
        striker: '',
        bowler: currentBowler ? currentBowler.name : '',
        description: `${extraName}${commentary ? ' - ' + commentary : ''}`
    });

    // Add to timeline
    addTimelineEvent(`${extraName} called${commentary ? ' - ' + commentary : ''}`);

    // Check for over completion (wides and no-balls don't count toward over)
    if (currentBowler && (extraType === 'bye' || extraType === 'legbye') && currentBowler.balls % 6 === 0 && currentBowler.balls > 0) {
        completeOver();
    }

    // Check for innings end (all out or overs completed)
    checkInningsEnd();

    // Clear commentary
    document.getElementById('ball-commentary').value = "";

    // Update display
    updateMatchDisplay();
    saveMatchToLocalStorage();
}

function addWicket(wicketType) {
    const battingTeam = matchData.currentInnings === 1 ? matchData.team1 : matchData.team2;
    const bowlingTeam = matchData.currentInnings === 1 ? matchData.team2 : matchData.team1;
    const currentBowler = bowlingTeam.bowling.find(p => p.isBowling);

    // Find current striker
    const striker = battingTeam.batting.find(p => p.striker);
    if (!striker || striker.out) return;

    // Save state for undo
    matchData.history.push({
        type: 'wicket',
        batsman: striker.name,
        wicketType: wicketType,
        bowler: currentBowler?.name || '',
        fielder: document.getElementById('fielding-position').value || '',
        partnershipRuns: matchData.partnership.runs,
        partnershipBalls: matchData.partnership.balls
    });

    // Update striker stats
    striker.out = true;
    striker.outType = wicketType;
    
    // Set bowler and fielder based on wicket type
    const fieldingPosition = document.getElementById('fielding-position').value;
    const commentary = document.getElementById('ball-commentary').value || "";
    
    if (wicketType !== 'runout') {
        if (currentBowler) {
            striker.outBowler = currentBowler.name;
            currentBowler.wickets++;
        }
        
        if (wicketType === 'caught' || wicketType === 'stumped') {
            striker.outFielder = fieldingPosition || (wicketType === 'stumped' ? bowlingTeam.wicketkeeper : 'unknown');
        }
    } else {
        striker.outFielder = fieldingPosition || 'unknown';
    }

    // Update team stats
    battingTeam.wickets++;
    battingTeam.balls++;

    // Update bowler stats
    if (currentBowler && wicketType !== 'runout') {
        currentBowler.balls++;
        
        // Check for maiden over
        if (currentBowler.balls % 6 === 0) {
            const overRuns = matchData.currentOver.slice(-6).reduce((sum, ball) => {
                return sum + (ball.type === 'w' || ball.type === 'wd' || ball.type === 'nb' ? 0 : ball.runs || 0);
            }, 0);
            
            if (overRuns === 0) {
                currentBowler.maidens++;
            }
            currentBowler.oversBowled++;
        }
    }

    // Reset partnership
    matchData.partnership = {
        runs: 0,
        balls: 0,
        batsman1: "",
        batsman2: ""
    };

    // Add ball to current over
    matchData.currentOver.push({
        type: 'w',
        runs: 0,
        striker: striker.name,
        bowler: currentBowler ? currentBowler.name : '',
        fielder: striker.outFielder || '',
        description: `Wicket! ${striker.name} ${wicketType}${currentBowler ? ' b ' + currentBowler.name : ''}${striker.outFielder ? ' c ' + striker.outFielder : ''}${commentary ? ' - ' + commentary : ''}`
    });

    // Add to timeline
    addTimelineEvent(`Wicket! ${striker.name} ${wicketType}${currentBowler ? ' b ' + currentBowler.name : ''}${striker.outFielder ? ' c ' + striker.outFielder : ''}${commentary ? ' - ' + commentary : ''}`);

    // Find next batsman
    const nextBatsman = battingTeam.batting.find(p => !p.out && !p.striker);
    if (nextBatsman) {
        nextBatsman.striker = true;
        
        // Update partnership
        const nonStriker = battingTeam.batting.find(p => p.striker && p.name !== nextBatsman.name);
        if (nonStriker) {
            matchData.partnership = {
                runs: 0,
                balls: 0,
                batsman1: nextBatsman.name,
                batsman2: nonStriker.name
            };
        }
    }

    // Check for over completion
    if (currentBowler && currentBowler.balls % 6 === 0 && currentBowler.balls > 0) {
        completeOver();
    }

    // Check for innings end (all out or overs completed)
    checkInningsEnd();

    // Clear commentary
    document.getElementById('ball-commentary').value = "";

    // Update display
    updateMatchDisplay();
    saveMatchToLocalStorage();
}

function rotateStrike() {
    const battingTeam = matchData.currentInnings === 1 ? matchData.team1 : matchData.team2;
    
    // Get current strikers
    const strikers = battingTeam.batting.filter(p => p.striker && !p.out);
    if (strikers.length !== 2) return;
    
    // Swap striker status
    strikers[0].striker = false;
    strikers[1].striker = true;
    
    // Update partnership
    matchData.partnership.batsman1 = strikers[1].name;
    matchData.partnership.batsman2 = strikers[0].name;
    
    updateMatchDisplay();
    saveMatchToLocalStorage();
}

function showBowlerModal() {
    const bowlingTeam = matchData.currentInnings === 1 ? matchData.team2 : matchData.team1;
    
    // Populate bowler select
    newBowlerSelect.innerHTML = '';
    bowlingTeam.bowling.forEach(player => {
        if (!player.isWicketkeeper && (player.oversBowled < (matchData.currentInnings === 1 ? matchData.team2.maxBowlerOvers : matchData.team1.maxBowlerOvers) || player.isBowling)) {
            const option = document.createElement('option');
            option.value = player.name;
            option.textContent = player.name + (player.isBowling ? ' (current)' : '');
            option.selected = player.isBowling;
            newBowlerSelect.appendChild(option);
        }
    });
    
    bowlerModal.style.display = 'block';
}

function changeBowler() {
    const bowlingTeam = matchData.currentInnings === 1 ? matchData.team2 : matchData.team1;
    const newBowlerName = newBowlerSelect.value;
    
    // Find current bowler and set to not bowling
    const currentBowler = bowlingTeam.bowling.find(p => p.isBowling);
    if (currentBowler) {
        currentBowler.isBowling = false;
    }
    
    // Set new bowler
    const newBowler = bowlingTeam.bowling.find(p => p.name === newBowlerName);
    if (newBowler) {
        newBowler.isBowling = true;
        
        // Add to timeline
        addTimelineEvent(`Bowler changed to ${newBowlerName}`);
    }
    
    bowlerModal.style.display = 'none';
    updateMatchDisplay();
    saveMatchToLocalStorage();
}

function completeOver() {
    const bowlingTeam = matchData.currentInnings === 1 ? matchData.team2 : matchData.team1;
    const currentBowler = bowlingTeam.bowling.find(p => p.isBowling);
    
    if (!currentBowler) return;
    
    // Rotate strike at the end of the over (unless odd number of runs on last ball)
    const lastBall = matchData.currentOver[matchData.currentOver.length - 1];
    if (!lastBall || !['1', '3', 'wide', 'noball'].includes(lastBall.type)) {
        rotateStrike();
    }
    
    // Reset current over
    matchData.currentOver = [];
    
    // Add to timeline
    addTimelineEvent(`Over completed. ${Math.floor(bowlingTeam.balls / 6)}.${bowlingTeam.balls % 6} overs bowled`);
    
    // Check if bowler has reached max overs
    if (currentBowler.oversBowled >= (matchData.currentInnings === 1 ? matchData.team2.maxBowlerOvers : matchData.team1.maxBowlerOvers)) {
        // Find next available bowler
        const nextBowler = bowlingTeam.bowling.find(p => 
            !p.isBowling && 
            !p.isWicketkeeper && 
            p.oversBowled < (matchData.currentInnings === 1 ? matchData.team2.maxBowlerOvers : matchData.team1.maxBowlerOvers)
        );
        
        if (nextBowler) {
            currentBowler.isBowling = false;
            nextBowler.isBowling = true;
            addTimelineEvent(`Bowler ${currentBowler.name} has bowled maximum overs. ${nextBowler.name} comes on to bowl.`);
        }
    }
    
    updateMatchDisplay();
    saveMatchToLocalStorage();
}

function checkInningsEnd() {
    const battingTeam = matchData.currentInnings === 1 ? matchData.team1 : matchData.team2;
    
    // Check if all out (all players except one)
    if (battingTeam.wickets >= battingTeam.players.length - 1) {
        endInnings();
        return;
    }

    // Check if overs completed
    if (battingTeam.balls >= matchData.totalOvers * 6) {
        endInnings();
        return;
    }
    
    // Check if target reached in 2nd innings
    if (matchData.currentInnings === 2 && battingTeam.totalRuns > matchData.team1.totalRuns) {
        endInnings();
        return;
    }
}

function endInnings() {
    const battingTeam = matchData.currentInnings === 1 ? matchData.team1 : matchData.team2;
    const bowlingTeam = matchData.currentInnings === 1 ? matchData.team2 : matchData.team1;
    
    // Complete current over
    const currentBowler = bowlingTeam.bowling.find(p => p.isBowling);
    if (currentBowler && currentBowler.balls % 6 !== 0) {
        currentBowler.oversBowled += (currentBowler.balls % 6) / 6;
        currentBowler.balls = Math.floor(currentBowler.balls / 6) * 6;
    }

    // Add to timeline
    addTimelineEvent(`Innings ended. ${battingTeam.name} ${battingTeam.totalRuns}/${battingTeam.wickets} in ${Math.floor(battingTeam.balls / 6)}.${battingTeam.balls % 6} overs`);

    // Check if match should end (2nd innings completed or target reached)
    if (matchData.currentInnings === 2 || 
        (matchData.currentInnings === 1 && matchData.matchType === 'test')) {
        matchData.matchEnded = true;
        showSummary();
    } else {
        // Switch to 2nd innings
        matchData.currentInnings = 2;
        
        // Reset striker and bowler
        matchData.team2.batting[0].striker = true;
        matchData.team2.batting[1].striker = true;
        
        // Reset all bowlers and set first bowler
        matchData.team1.bowling.forEach((bowler, i) => {
            bowler.isBowling = i === 0;
        });

        // Reset partnership
        matchData.partnership = {
            runs: 0,
            balls: 0,
            batsman1: matchData.team2.batting[0].name,
            batsman2: matchData.team2.batting[1].name
        };

        // Reset current over
        matchData.currentOver = [];

        // Add to timeline
        addTimelineEvent(`${matchData.team2.name} needs ${matchData.team1.totalRuns + 1} runs to win`);

        updateMatchDisplay();
    }

    saveMatchToLocalStorage();
}

function showSummary() {
    matchSection.classList.add('hidden');
    summarySection.classList.remove('hidden');

    // Update team names
    document.getElementById('summary-team1-name').textContent = matchData.team1.name;
    document.getElementById('summary-team2-name').textContent = matchData.team2.name;

    // Update team 1 batting
    const team1Batting = document.getElementById('summary-team1-batting');
    team1Batting.innerHTML = '';
    matchData.team1.batting.forEach(player => {
        const row = document.createElement('tr');
        row.className = 'border-b border-gray-100';
        row.innerHTML = `
            <td class="py-2">${player.name} ${player.isWicketkeeper ? '(wk)' : ''} ${player.out ? `(${player.outType}${player.outBowler ? ' b ' + player.outBowler : ''}${player.outFielder ? ' c ' + player.outFielder : ''})` : 'not out'}</td>
            <td class="py-2 text-right">${player.runs}</td>
            <td class="py-2 text-right">${player.balls}</td>
            <td class="py-2 text-right">${player.fours}</td>
            <td class="py-2 text-right">${player.sixes}</td>
            <td class="py-2 text-right">${player.balls > 0 ? ((player.runs / player.balls) * 100).toFixed(1) : '-'}</td>
        `;
        team1Batting.appendChild(row);
    });

    // Update team 2 bowling
    const team2Bowling = document.getElementById('summary-team2-bowling');
    team2Bowling.innerHTML = '';
    matchData.team2.bowling.forEach(player => {
        if (player.balls > 0) {
            const row = document.createElement('tr');
            row.className = 'border-b border-gray-100';
            row.innerHTML = `
                <td class="py-2">${player.name} ${player.isWicketkeeper ? '(wk)' : ''}</td>
                <td class="py-2 text-right">${Math.floor(player.balls / 6)}.${player.balls % 6}</td>
                <td class="py-2 text-right">${player.maidens}</td>
                <td class="py-2 text-right">${player.runs}</td>
                <td class="py-2 text-right">${player.wickets}</td>
                <td class="py-2 text-right">${player.balls > 0 ? (player.runs / (player.balls / 6)).toFixed(1) : '-'}</td>
            `;
            team2Bowling.appendChild(row);
        }
    });

    // Update team 2 batting
    const team2Batting = document.getElementById('summary-team2-batting');
    team2Batting.innerHTML = '';
    matchData.team2.batting.forEach(player => {
        const row = document.createElement('tr');
        row.className = 'border-b border-gray-100';
        row.innerHTML = `
            <td class="py-2">${player.name} ${player.isWicketkeeper ? '(wk)' : ''} ${player.out ? `(${player.outType}${player.outBowler ? ' b ' + player.outBowler : ''}${player.outFielder ? ' c ' + player.outFielder : ''})` : 'not out'}</td>
            <td class="py-2 text-right">${player.runs}</td>
            <td class="py-2 text-right">${player.balls}</td>
            <td class="py-2 text-right">${player.fours}</td>
            <td class="py-2 text-right">${player.sixes}</td>
            <td class="py-2 text-right">${player.balls > 0 ? ((player.runs / player.balls) * 100).toFixed(1) : '-'}</td>
        `;
        team2Batting.appendChild(row);
    });

    // Update team 1 bowling
    const team1Bowling = document.getElementById('summary-team1-bowling');
    team1Bowling.innerHTML = '';
    matchData.team1.bowling.forEach(player => {
        if (player.balls > 0) {
            const row = document.createElement('tr');
            row.className = 'border-b border-gray-100';
            row.innerHTML = `
                <td class="py-2">${player.name} ${player.isWicketkeeper ? '(wk)' : ''}</td>
                <td class="py-2 text-right">${Math.floor(player.balls / 6)}.${player.balls % 6}</td>
                <td class="py-2 text-right">${player.maidens}</td>
                <td class="py-2 text-right">${player.runs}</td>
                <td class="py-2 text-right">${player.wickets}</td>
                <td class="py-2 text-right">${player.balls > 0 ? (player.runs / (player.balls / 6)).toFixed(1) : '-'}</td>
            `;
            team1Bowling.appendChild(row);
        }
    });

    // Update result
    const resultElement = document.getElementById('match-result');
    const summaryElement = document.getElementById('match-summary');
    
    if (matchData.currentInnings === 1 && matchData.matchType === 'test') {
        resultElement.textContent = `${matchData.team1.name} declared at ${matchData.team1.totalRuns}/${matchData.team1.wickets}`;
        summaryElement.textContent = `Match is in progress. ${matchData.team2.name} will bat next.`;
    } 
    else if (matchData.team1.totalRuns > matchData.team2.totalRuns) {
        const margin = matchData.team1.totalRuns - matchData.team2.totalRuns;
        resultElement.textContent = `${matchData.team1.name} won by ${margin} run${margin !== 1 ? 's' : ''}`;
        summaryElement.textContent = `${matchData.team1.name} scored ${matchData.team1.totalRuns}/${matchData.team1.wickets} in ${Math.floor(matchData.team1.balls / 6)}.${matchData.team1.balls % 6} overs. ${matchData.team2.name} scored ${matchData.team2.totalRuns}/${matchData.team2.wickets} in ${Math.floor(matchData.team2.balls / 6)}.${matchData.team2.balls % 6} overs.`;
    } 
    else if (matchData.team2.totalRuns > matchData.team1.totalRuns) {
        const wicketsLeft = matchData.team2.players.length - 1 - matchData.team2.wickets;
        resultElement.textContent = `${matchData.team2.name} won by ${wicketsLeft} wicket${wicketsLeft !== 1 ? 's' : ''}`;
        summaryElement.textContent = `${matchData.team2.name} chased ${matchData.team1.totalRuns} in ${Math.floor(matchData.team2.balls / 6)}.${matchData.team2.balls % 6} overs, losing ${matchData.team2.wickets} wicket${matchData.team2.wickets !== 1 ? 's' : ''}.`;
    } 
    else {
        resultElement.textContent = "Match tied";
        summaryElement.textContent = `Both teams scored ${matchData.team1.totalRuns} runs.`;
    }

    // Update timeline
    const timelineElement = document.getElementById('match-timeline');
    timelineElement.innerHTML = '';
    
    matchData.timeline.forEach(event => {
        const div = document.createElement('div');
        div.className = 'mb-1 last:mb-0 text-sm';
        div.textContent = event;
        timelineElement.appendChild(div);
    });
}

function undoLastAction() {
    if (matchData.history.length === 0) return;

    const lastAction = matchData.history.pop();
    const battingTeam = matchData.currentInnings === 1 ? matchData.team1 : matchData.team2;
    const bowlingTeam = matchData.currentInnings === 1 ? matchData.team2 : matchData.team1;

    if (lastAction.type === 'runs') {
        // Undo runs
        const striker = battingTeam.batting.find(p => p.name === lastAction.striker);
        if (striker) {
            striker.runs -= lastAction.runs;
            striker.balls--;
            if (lastAction.runs === 4) striker.fours--;
            if (lastAction.runs === 6) striker.sixes--;
        }

        battingTeam.totalRuns -= lastAction.runs;
        battingTeam.balls--;

        // Update partnership
        matchData.partnership.runs = lastAction.partnershipRuns;
        matchData.partnership.balls = lastAction.partnershipBalls;

        const bowler = bowlingTeam.bowling.find(p => p.name === lastAction.bowler);
        if (bowler) {
            bowler.runs -= lastAction.runs;
            bowler.balls--;
            if (bowler.balls % 6 === 5) { // If we're going back to previous over
                bowler.oversBowled--;
            }
        }

        // Remove last ball from current over
        matchData.currentOver.pop();

        // Undo strike rotation if odd runs
        if (lastAction.runs % 2 !== 0) {
            rotateStrike();
        }
    } 
    else if (lastAction.type === 'extra') {
        // Undo extra
        battingTeam.totalRuns--;
        battingTeam.extras--;

        const bowler = bowlingTeam.bowling.find(p => p.name === lastAction.bowler);
        if (bowler) {
            if (lastAction.extraType === 'wide' || lastAction.extraType === 'noball') {
                bowler.runs--;
            }
            
            if (lastAction.extraType === 'noball') {
                // No ball doesn't count as a ball, so no change needed
            } 
            else if (lastAction.extraType === 'wide') {
                // Wide doesn't count as a ball, so no change needed
            } 
            else {
                // Bye or leg bye counts as a ball
                bowlingTeam.balls--;
                bowler.balls--;
                if (bowler.balls % 6 === 5) { // If we're going back to previous over
                    bowler.oversBowled--;
                }
            }
        }

        // Remove last ball from current over
        matchData.currentOver.pop();
        
        // Restore partnership
        matchData.partnership.runs = lastAction.partnershipRuns;
        matchData.partnership.balls = lastAction.partnershipBalls;
    } 
    else if (lastAction.type === 'wicket') {
        // Undo wicket
        const batsman = battingTeam.batting.find(p => p.name === lastAction.batsman);
        if (batsman) {
            batsman.out = false;
            batsman.outType = "";
            batsman.outBowler = "";
            batsman.outFielder = "";
            batsman.striker = true; // Assume they were the striker
        }

        battingTeam.wickets--;
        battingTeam.balls--;

        const bowler = bowlingTeam.bowling.find(p => p.name === lastAction.bowler);
        if (bowler && lastAction.wicketType !== 'runout') {
            bowler.wickets--;
            bowler.balls--;
            if (bowler.balls % 6 === 5) { // If we're going back to previous over
                bowler.oversBowled--;
            }
        }

        // Restore partnership
        matchData.partnership.runs = lastAction.partnershipRuns;
        matchData.partnership.balls = lastAction.partnershipBalls;

        // Remove last ball from current over
        matchData.currentOver.pop();

        // Find who was batting before and restore
        const currentStrikers = battingTeam.batting.filter(p => p.striker);
        if (currentStrikers.length === 1) {
            // Only one striker, need to find who was out
            const outPlayer = battingTeam.batting.find(p => p.name === lastAction.batsman);
            if (outPlayer) {
                outPlayer.striker = true;
            }
        }
    }

    // Remove last timeline event
    matchData.timeline.pop();

    // If we undid something that caused the innings to end, reset matchEnded flag
    if (matchData.matchEnded) {
        matchData.matchEnded = false;
        matchSection.classList.remove('hidden');
        summarySection.classList.add('hidden');
    }

    updateMatchDisplay();
    saveMatchToLocalStorage();
}

function resetMatch() {
    if (confirm('Are you sure you want to start a new match? All current data will be lost.')) {
        matchData = {
            team1: {
                name: "",
                players: [],
                batting: [],
                bowling: [],
                totalRuns: 0,
                wickets: 0,
                overs: 0,
                balls: 0,
                extras: 0,
                wicketkeeper: "",
                maxBowlerOvers: 0
            },
            team2: {
                name: "",
                players: [],
                batting: [],
                bowling: [],
                totalRuns: 0,
                wickets: 0,
                overs: 0,
                balls: 0,
                extras: 0,
                wicketkeeper: "",
                maxBowlerOvers: 0
            },
            currentInnings: 1,
            totalOvers: 20,
            powerplayOvers: 6,
            matchType: "limited",
            history: [],
            timeline: [],
            matchStarted: false,
            matchEnded: false,
            currentOver: [],
            partnership: {
                runs: 0,
                balls: 0,
                batsman1: "",
                batsman2: ""
            }
        };

        // Reset form
        document.getElementById('team1-name').value = '';
        document.getElementById('team2-name').value = '';
        document.getElementById('team1-players').innerHTML = `
            <div class="flex gap-2 items-center">
                <input type="text" class="flex-1 px-3 py-2 border border-gray-300 rounded-md" placeholder="Player name">
                <div class="flex items-center gap-2">
                    <label class="text-xs text-gray-500">WK</label>
                    <input type="checkbox" class="wicketkeeper">
                </div>
                <button class="remove-player px-2 py-1 bg-red-100 text-red-700 rounded-md text-sm">×</button>
            </div>
        `;
        document.getElementById('team2-players').innerHTML = `
            <div class="flex gap-2 items-center">
                <input type="text" class="flex-1 px-3 py-2 border border-gray-300 rounded-md" placeholder="Player name">
                <div class="flex items-center gap-2">
                    <label class="text-xs text-gray-500">WK</label>
                    <input type="checkbox" class="wicketkeeper">
                </div>
                <button class="remove-player px-2 py-1 bg-red-100 text-red-700 rounded-md text-sm">×</button>
            </div>
        `;
        document.getElementById('total-overs').value = '20';
        document.getElementById('powerplay-overs').value = '6';
        document.getElementById('match-type').value = 'limited';

        // Show setup section
        setupSection.classList.remove('hidden');
        matchSection.classList.add('hidden');
        summarySection.classList.add('hidden');

        // Clear saved match
        localStorage.removeItem('cricketMatchData');
    }
}

function saveMatch() {
    saveMatchToLocalStorage();
    alert('Match data saved successfully! You can load it later.');
}

function loadMatch() {
    const savedMatch = localStorage.getItem('cricketMatchData');
    if (savedMatch) {
        try {
            const parsedData = JSON.parse(savedMatch);
            if (parsedData.matchStarted) {
                matchData = parsedData;
                if (matchData.matchEnded) {
                    showSummary();
                } else {
                    startMatch();
                }
                return;
            }
        } catch (e) {
            console.error("Error loading saved match:", e);
        }
    }
    alert('No saved match found or error loading match.');
}

function exportMatch() {
    const dataStr = JSON.stringify(matchData, null, 2);
    const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);
    
    const exportFileDefaultName = `cricket_match_${new Date().toISOString().slice(0,10)}.json`;
    
    const linkElement = document.createElement('a');
    linkElement.setAttribute('href', dataUri);
    linkElement.setAttribute('download', exportFileDefaultName);
    linkElement.click();
}

function saveMatchToLocalStorage() {
    localStorage.setItem('cricketMatchData', JSON.stringify(matchData));
}

function addTimelineEvent(event) {
    const now = new Date();
    const timeString = now.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'});
    matchData.timeline.push(`[${timeString}] ${event}`);
}