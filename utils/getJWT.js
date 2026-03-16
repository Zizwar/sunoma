import AsyncStorage from '@react-native-async-storage/async-storage';

const UA = 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_4 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.4 Mobile/15E148 Safari/604.1';

/**
 * 1. Use stored @bearer to call get_user_session_id → session_id
 * 2. POST auth.suno.com/v1/client/sessions/{id}/touch → fresh JWT
 * 3. Fallback: use saved @touchUrl
 * 4. Fallback: return stored @jwt as-is
 */
export const getFreshJWT = async () => {
  try {
    const bearer = await AsyncStorage.getItem('@bearer');
    if (!bearer) throw new Error('No bearer token - login via Central screen first');

    // Step 1: get session_id
    const sessionRes = await fetch(
      'https://studio-api.prod.suno.com/api/user/get_user_session_id/',
      {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${bearer}`,
          'Accept': 'application/json',
          'User-Agent': UA,
        },
      }
    );
    if (!sessionRes.ok) throw new Error(`get_user_session_id failed: ${sessionRes.status}`);

    const { session_id } = await sessionRes.json();
    if (!session_id) throw new Error('No session_id in response');

    // Step 2: touch to get fresh JWT
    const touchRes = await fetch(
      `https://auth.suno.com/v1/client/sessions/${session_id}/touch`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${bearer}`,
          'Accept': 'application/json',
          'Content-Type': 'application/json',
          'Origin': 'https://suno.com',
          'Referer': 'https://suno.com/',
          'User-Agent': UA,
        },
      }
    );
    if (!touchRes.ok) throw new Error(`Touch failed: ${touchRes.status}`);

    const touchData = await touchRes.json();
    const freshJWT = touchData.response?.last_active_token?.jwt;
    if (!freshJWT) throw new Error('No JWT in touch response');

    await AsyncStorage.setItem('@jwt', freshJWT);
    await AsyncStorage.setItem('@bearer', freshJWT);

    // Save profile data while we have it
    const u = touchData.response?.user;
    if (u) {
      const name = `${u.first_name ?? ''} ${u.last_name ?? ''}`.trim();
      await AsyncStorage.multiSet([
        ['profileImage', u.profile_image_url || ''],
        ['profileName', name],
        ['profileHandle', u.handle || ''],
      ]);
    }

    return freshJWT;

  } catch (error) {
    console.error('getFreshJWT (session route) failed:', error.message);

    // Fallback: use saved @touchUrl
    try {
      const touchUrl = await AsyncStorage.getItem('@touchUrl');
      if (touchUrl) {
        const res = await fetch(touchUrl, {
          method: 'POST',
          headers: {
            'Accept': 'application/json',
            'Content-Type': 'application/json',
            'Origin': 'https://suno.com',
            'Referer': 'https://suno.com/',
            'User-Agent': UA,
          },
        });
        if (res.ok) {
          const data = await res.json();
          const jwt = data.response?.last_active_token?.jwt;
          if (jwt) {
            await AsyncStorage.setItem('@jwt', jwt);
            await AsyncStorage.setItem('@bearer', jwt);
            return jwt;
          }
        }
      }
    } catch (e2) {
      console.error('getFreshJWT (touchUrl fallback) failed:', e2.message);
    }

    // Final fallback: return stored JWT
    return await AsyncStorage.getItem('@jwt');
  }
};
