using Dapper;
using Microsoft.Data.SqlClient;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging;
using System;
using System.Collections.Generic;
using System.Data;
using System.Globalization;
using System.Linq;
using System.Threading.Tasks;
using Technicians.Api.Models;

namespace Technicians.Api.Repository
{


    public class PartsShippingDataRepository
    {
        private readonly string _connectionString;
        private readonly ILogger<PartsShippingDataRepository>? _logger;

        public PartsShippingDataRepository(IConfiguration configuration, ILogger<PartsShippingDataRepository>? logger = null)
        {
            _connectionString = configuration.GetConnectionString("DefaultConnection")
                ?? throw new InvalidOperationException("DefaultConnection not configured");
            _logger = logger;
        }

        // concise, robust mapping: query dynamic rows then map with safe parsers
        public async Task<IEnumerable<PartsShippingDataDto>> GetShippingDataAsync(string callNbr, int? scidInc)
        {
            if (string.IsNullOrWhiteSpace(callNbr))
                throw new ArgumentException(nameof(callNbr));

            using var conn = new SqlConnection(_connectionString);
            var parameters = new DynamicParameters();
            parameters.Add("@CallNbr", callNbr, DbType.String);
            parameters.Add("@SCID_Inc", scidInc ?? 0, DbType.Int32);

            try
            {
                await conn.OpenAsync();
                var rows = await conn.QueryAsync(sql: "GetShippingData", param: parameters, commandType: CommandType.StoredProcedure, commandTimeout: 60);

                // map each dynamic row to DTO using helper parsers (handles DBNull, empty strings, bad data)
                var list = rows.Select(row =>
                {
                    var dict = (IDictionary<string, object>)row;
                    return new PartsShippingDataDto
                    {
                        Service_Call_ID = Get<string>(dict, "Service_Call_ID"),
                        SCID_Inc = Get<int>(dict, "SCID_Inc"),
                        Part_Num = Get<string>(dict, "Part_Num"),
                        DC_Part_Num = Get<string>(dict, "DC_Part_Num"),
                        Description = Get<string>(dict, "Description"),
                        Shipping_Company = Get<string>(dict, "Shipping_Company"),
                        Tracking_Num = Get<string>(dict, "Tracking_Num"),
                        Courier = Get<string>(dict, "Courier"),
                        Destination = Get<string>(dict, "Destination"),
                        Ship_Date = Get<DateTime?>(dict, "Ship_Date"),
                        Qty = Get<int?>(dict, "Qty"),
                        Shipment_Type = Get<string>(dict, "Shipment_Type"),
                        Shipping_Cost = Get<decimal?>(dict, "Shipping_Cost"),
                        Courier_Cost = Get<decimal?>(dict, "Courier_Cost"),
                        ETA = Get<DateTime?>(dict, "ETA"),
                        Shipped_from = Get<string>(dict, "Shipped_from"),
                        Create_Date = Get<DateTime?>(dict, "Create_Date"),
                        LastModified = Get<DateTime?>(dict, "LastModified"),
                        Maint_Auth_ID = Get<string>(dict, "Maint_Auth_ID")
                    };
                }).ToList();

                return list;
            }
            catch (Exception ex)
            {
                _logger?.LogError(ex, "Error fetching shipping data for CallNbr={CallNbr}, SCID_Inc={SCID_Inc}", callNbr, scidInc);
                throw;
            }
        }

        // small helper that safely extracts and converts values
        private static T Get<T>(IDictionary<string, object> dict, string key)
        {
            // match keys case-insensitively
            var kv = dict.FirstOrDefault(k => string.Equals(k.Key, key, StringComparison.OrdinalIgnoreCase));
            if (kv.Key == null) return default!;

            var val = kv.Value;
            if (val == null || val == DBNull.Value) return default!;

            var targetType = typeof(T);
            var nullableUnderlying = Nullable.GetUnderlyingType(targetType);
            var isNullable = nullableUnderlying != null || !targetType.IsValueType;
            var effectiveType = nullableUnderlying ?? targetType;

            var s = val as string;
            if (s != null)
            {
                if (string.IsNullOrWhiteSpace(s))
                {
                    return default!;
                }

                if (effectiveType == typeof(int))
                {
                    return (T)(object)(int.TryParse(s, NumberStyles.Any, CultureInfo.InvariantCulture, out var i) ? i : default(int));
                }
                if (effectiveType == typeof(decimal))
                {
                    return (T)(object)(decimal.TryParse(s, NumberStyles.Any, CultureInfo.InvariantCulture, out var d) ? d : default(decimal));
                }
                if (effectiveType == typeof(double))
                {
                    return (T)(object)(double.TryParse(s, NumberStyles.Any, CultureInfo.InvariantCulture, out var dd) ? dd : default(double));
                }
                if (effectiveType == typeof(DateTime))
                {
                    return (T)(object?)(DateTime.TryParse(s, CultureInfo.InvariantCulture, DateTimeStyles.AssumeLocal, out var dt) ? dt : (DateTime?)null);
                }
                if (effectiveType == typeof(bool))
                {
                    if (bool.TryParse(s, out var b)) return (T)(object)b;
                    if (s == "0") return (T)(object)false;
                    if (s == "1") return (T)(object)true;
                }
                // fallback string->object conversions
                try
                {
                    var converted = Convert.ChangeType(s, effectiveType, CultureInfo.InvariantCulture);
                    return (T)converted!;
                }
                catch
                {
                    return default!;
                }
            }

            try
            {
                // if val is already the correct type or convertible
                if (effectiveType.IsInstanceOfType(val)) return (T)val!;
                var converted = Convert.ChangeType(val, effectiveType, CultureInfo.InvariantCulture);
                return (T)converted!;
            }
            catch
            {
                return default!;
            }
        }
    }
}