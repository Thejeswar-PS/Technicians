namespace Technicians.Api.Models
{
    public class GeneratorInfoDto
    {
        // --- Core ---
        public string CallNbr { get; set; }
        public int EquipId { get; set; }
        public string IdCounter { get; set; }
        public string EquipStatus { get; set; }
        public string GenDateCodeMonth { get; set; }
        public string GenDateCodeYear { get; set; }

        // --- Battery / Charger ---
        public string BatCleanliness { get; set; }
        public string ElectrolyteLevel { get; set; }
        public string ClampTightness { get; set; }
        public string CheckBatCharger { get; set; }
        public string CheckCables { get; set; }
        public string CheckBatPosts { get; set; }
        public string CheckBatLugs { get; set; }
        public string ApplyCorrInhibitor { get; set; }
        public string AlternatorVoltage { get; set; }

        public string Bat1Voltage { get; set; }
        public string Bat2Voltage { get; set; }
        public string Bat3Voltage { get; set; }
        public string Bat4Voltage { get; set; }

        public string ChargingVoltageOffline { get; set; }
        public string ChargingVoltageOnline { get; set; }
        public string ChargingCurrentOffline { get; set; }
        public string ChargingCurrentOnline { get; set; }

        public string CheckAlarms { get; set; }
        public string BatNotes { get; set; }

        public string Bat1VDC { get; set; }
        public string Bat1Cond { get; set; }
        public string Bat1SG { get; set; }
        public string Bat2VDC { get; set; }
        public string Bat2Cond { get; set; }
        public string Bat2SG { get; set; }
        public string Bat3VDC { get; set; }
        public string Bat3Cond { get; set; }
        public string Bat3SG { get; set; }
        public string Bat4VDC { get; set; }
        public string Bat4Cond { get; set; }
        public string Bat4SG { get; set; }

        // --- Cooling System ---
        public string CheckCoolantLeaks { get; set; }
        public string CheckCoolantLevel { get; set; }
        public string TestCoolant { get; set; }
        public string CheckFanBelts { get; set; }
        public string CheckRadiatorDamage { get; set; }
        public string RadiatorCap { get; set; }
        public string CheckWaterPump { get; set; }
        public string CheckEngBlockHeater { get; set; }
        public string CheckCoolantHoses { get; set; }
        public string CoolantReading { get; set; }
        public string LubeDrivePulley { get; set; }
        public string CoolantAdded { get; set; }
        public string EngHtrTemp { get; set; }
        public string ChangeFilter { get; set; }
        public string CoolingMinorLeaks { get; set; }
        public string CheckRadiator { get; set; }
        public string PressTestSys { get; set; }
        public string CoolingSysNotes { get; set; }

        // --- Fuel System ---
        public string CheckFuelLeaks { get; set; }
        public string CheckRemotePump { get; set; }
        public string CheckDayTank { get; set; }
        public string CheckTransferPump { get; set; }
        public string ChangeDayTankFilter { get; set; }
        public string CheckLinkage { get; set; }
        public string ChangeFuelFilter { get; set; }
        public string ChangeWaterSeperator { get; set; }
        public string FuelMinorLeaks { get; set; }
        public string LubricateGovLinkage { get; set; }
        public string FuelNotes { get; set; }

        // --- Lube / Oil ---
        public string TakeOilSample { get; set; }
        public string ChangeLubeOil { get; set; }
        public string ChangeLubeOilFilter { get; set; }
        public string CheckLubeLeaks { get; set; }
        public string CheckOilLevel { get; set; }
        public string DisposeUsedOil { get; set; }
        public string WipeEngine { get; set; }
        public string LubeNotes { get; set; }

        // --- Exhaust ---
        public string CheckExhaustSystem { get; set; }
        public string CheckAirInductionSys { get; set; }
        public string CheckAirIntakeFilter { get; set; }
        public string CheckCrankcase { get; set; }
        public string CheckLouvers { get; set; }
        public string CheckFlexConnection { get; set; }
        public string CheckrainCap { get; set; }
        public string CheckExhaustLeaks { get; set; }
        public string RepairExhaustLeaks { get; set; }
        public string CheckBoxDrain { get; set; }
        public string DrainCondensationTrap { get; set; }
        public string ExhaustNotes { get; set; }

        // --- Generator / Control Panel ---
        public string CheckGenBrushes { get; set; }
        public string CheckGenConnection { get; set; }
        public string CheckGenBreaker { get; set; }
        public string CheckControlWire { get; set; }
        public string CheckFaultLamps { get; set; }
        public string CheckGenBearing { get; set; }
        public string CleanControlPanel { get; set; }
        public string CleanGenVent { get; set; }
        public string LubeCircuitBreaker { get; set; }
        public string CheckLubeGenBearing { get; set; }
        public string ControlPanelNotes { get; set; }

        // --- Engine / Electrical Measurements ---
        public string BatDateCodeMonth { get; set; }
        public string BatDateCodeYear { get; set; }
        public string CheckAccuracy { get; set; }
        public string EngHours { get; set; }
        public string OilPressureCold { get; set; }
        public string WaterTemp { get; set; }
        public string CheckEngLeaks { get; set; }
        public string Tachometer { get; set; }
        public string OilPressureHot { get; set; }
        public string TestOvercrank { get; set; }
        public string CheckAllAlarms { get; set; }
        public string Freq { get; set; }

        public string CurrentA { get; set; }
        public string CurrentB { get; set; }
        public string CurrentC { get; set; }

        public string VoltageAB { get; set; }
        public string VoltageBC { get; set; }
        public string VoltageCA { get; set; }
        public string VoltageAN { get; set; }
        public string VoltageBN { get; set; }
        public string VoltageCN { get; set; }

        // --- Metadata / Parts ---
        public string GenLocation { get; set; }
        public string SiteIDNum { get; set; }
        public string EngModel { get; set; }
        public string EngSN { get; set; }
        public string Manuf { get; set; }

        public string OilFilterPartNum { get; set; }
        public string NumOilFilter { get; set; }
        public string FuelFilterPartNum { get; set; }
        public string NumFuelFilter { get; set; }
        public string CoolantFilterpartNum { get; set; }
        public string NumCoolantFilter { get; set; }
        public string AirFilterPartNum { get; set; }
        public string NumAirFilter { get; set; }
        public string WaterSepPartNum { get; set; }
        public string NumWaterSepFilter { get; set; }

        public string AmtOil { get; set; }
        public string AmtCoolant { get; set; }

        public string Bat1SG2 { get; set; }
        public string Bat1SG4 { get; set; }
        public string Bat3SG2 { get; set; }
        public string Bat3SG4 { get; set; }
    }


}
