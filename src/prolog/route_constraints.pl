% src/prolog/route_constraints.pl

% --- Optimization Strategies ---

% 1. Budget Strategy (Formerly "Minimize Transfers")
% "Less transfers = less money spent"
optimize_for(budget, [
    weight(transfers, 100.0),  % Huge penalty for changing buses
    weight(time, 1.0),         % Time matters less
    weight(fare, 1.0)
]).

% 2. Time Strategy (Standard Fastest Route)
% "Just get me there fast"
optimize_for(time, [
    weight(time, 1.0),         % Every minute counts
    weight(transfers, 5.0),    % Small penalty (just for convenience)
    weight(fare, 0.0)          % Money is no object
]).

% --- User Constraint Mapping ---

implies(broke, budget).
implies(cheap, budget).
implies(save_money, budget).
implies(lazy, budget).          % The "Lazy" route
implies(direct, budget).        % "I want a direct bus"

implies(hurry, time).
implies(fast, time).
implies(late, time).
implies(urgent, time).