namespace PujaCollectionTracker.Web.Authentication;

internal static class AuthCookies
{
  public const string AccessTokenName = "access_token";
  public const string RefreshTokenName = "refresh_token";

  public static void SetAuthCookies(
    HttpResponse response,
    string accessToken,
    DateTime accessTokenExpiresAt,
    string refreshToken,
    DateTime refreshTokenExpiresAt)
  {
    response.Cookies.Append(AccessTokenName, accessToken, CreateCookieOptions(response.HttpContext.Request, accessTokenExpiresAt));
    response.Cookies.Append(RefreshTokenName, refreshToken, CreateCookieOptions(response.HttpContext.Request, refreshTokenExpiresAt));
  }

  public static void ClearAuthCookies(HttpResponse response)
  {
    response.Cookies.Delete(AccessTokenName, CreateDeleteCookieOptions(response.HttpContext.Request));
    response.Cookies.Delete(RefreshTokenName, CreateDeleteCookieOptions(response.HttpContext.Request));
  }

  private static CookieOptions CreateCookieOptions(HttpRequest request, DateTime expiresAt)
  {
    bool isHttps = request.IsHttps;
    return new CookieOptions
    {
      HttpOnly = true,
      Secure = isHttps,
      SameSite = isHttps ? SameSiteMode.None : SameSiteMode.Lax,
      Expires = new DateTimeOffset(expiresAt),
      Path = "/"
    };
  }

  private static CookieOptions CreateDeleteCookieOptions(HttpRequest request)
  {
    bool isHttps = request.IsHttps;
    return new CookieOptions
    {
      Secure = isHttps,
      SameSite = isHttps ? SameSiteMode.None : SameSiteMode.Lax,
      Path = "/"
    };
  }
}
