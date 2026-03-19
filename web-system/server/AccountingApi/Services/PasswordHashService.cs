using System.Security.Cryptography;

namespace AccountingApi.Services;

public sealed class PasswordHashService
{
    // PBKDF2-SHA256 with high iteration count.
    private const int SaltSize = 16;
    private const int HashSize = 32;
    private const int Iterations = 120_000;

    public (string Hash, string Salt, int Iterations) HashPassword(string password)
    {
        var saltBytes = RandomNumberGenerator.GetBytes(SaltSize);
        var hashBytes = Rfc2898DeriveBytes.Pbkdf2(password, saltBytes, Iterations, HashAlgorithmName.SHA256, HashSize);
        return (Convert.ToBase64String(hashBytes), Convert.ToBase64String(saltBytes), Iterations);
    }

    public bool Verify(string password, string storedHashBase64, string storedSaltBase64, int iterations)
    {
        if (string.IsNullOrWhiteSpace(storedHashBase64) || string.IsNullOrWhiteSpace(storedSaltBase64) || iterations <= 0)
            return false;

        byte[] expectedHash;
        byte[] salt;
        try
        {
            expectedHash = Convert.FromBase64String(storedHashBase64);
            salt = Convert.FromBase64String(storedSaltBase64);
        }
        catch
        {
            return false;
        }

        var computedHash = Rfc2898DeriveBytes.Pbkdf2(password, salt, iterations, HashAlgorithmName.SHA256, expectedHash.Length);
        return CryptographicOperations.FixedTimeEquals(expectedHash, computedHash);
    }
}
