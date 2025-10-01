export interface ITrendingReportTeam {
    id:                  number;
    offId:               number;
    offName:             string;
    quotesWritten:       number;
    jobScheduled:        number;
    emergencyJobs:       number;
    jobsProcessed:       number;
    pastDueJobs:         number;
    jobsCompletedByTech: number;
    jobsToBeUploaded:    number;
    jobsToSchedule:      number;
    amRanking:           number;
    totalApproved:       number;
    teamName:            string;
    teamRank:            number;
    type:                number;
}
export interface IReportTeam {
additionalTeam: ITrendingReportTeam[],
gridTotal:ITrendingReportTeam,
team1: ITrendingReportTeam[], 
team2: ITrendingReportTeam[],
team3: ITrendingReportTeam[],
team4: ITrendingReportTeam[]
}

                
