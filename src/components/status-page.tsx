'use client';

import { useState, useEffect, useCallback } from 'react';
import { DomainSslStatus, DomainWhoisStatus } from '@/types/api';
import { processSslStatusItem, processDomainCertStatus } from '@/lib/certificate-utils';
import { processWhoisStatusItem, processWhoisDomainStatusNew } from '@/lib/whois-utils';
import { config } from '@/lib/config';
import DomainSslTable from './domain-ssl-table';
import WhoisStatusTable from './whois-status-table';
import { sslApi, whoisApi, domainsApi, ApiError } from '@/lib/api-client';


export default function StatusPage() {
  const [domainSslData, setDomainSslData] = useState<DomainSslStatus[]>([]);
  const [domainWhoisData, setDomainWhoisData] = useState<DomainWhoisStatus[]>([]);
  const [sslLoading, setSslLoading] = useState(true);
  const [whoisLoading, setWhoisLoading] = useState(true);

  // Toggle between old and new API formats
  // Set to true to use new API format (/api/domains with provider info)
  // Set to false to use legacy API format (/ssl/status)
  const USE_NEW_API_FORMAT = true;

  const fetchCertificates = useCallback(async () => {
    setSslLoading(true);

    try {
      let sslData: DomainSslStatus[];

      if (USE_NEW_API_FORMAT) {
        console.log('🌐 Fetching SSL status from NEW API format (/status/cert)');
        const response = await domainsApi.getCertStatus();
        sslData = response.data.map(processDomainCertStatus);
      } else {
        console.log('🌐 Fetching SSL status from legacy API format (/ssl/status)');
        const data = await sslApi.getStatus();
        sslData = data.ssl_status.map(processSslStatusItem);
      }

      setDomainSslData(sslData);

      // Cache the data
      localStorage.setItem('cert-status-data', JSON.stringify({
        sslData,
        timestamp: new Date().toISOString(),
      }));

    } catch (error) {
      console.error('Failed to fetch certificates:', error);

      if (error instanceof ApiError) {
        console.error('API Error:', error.message, error.status);
      }

      // Set empty array on API failure
      setDomainSslData([]);
    } finally {
      setSslLoading(false);
    }
  }, [USE_NEW_API_FORMAT]);

  const handleSslRefresh = async () => {
    setSslLoading(true);

    try {
      let sslData: DomainSslStatus[];

      if (USE_NEW_API_FORMAT) {
        console.log('🔄 Refreshing SSL status with cache refresh (/status/cert?refresh_cache=true)');
        const response = await domainsApi.getCertStatus(true); // Pass true to refresh cache
        sslData = response.data.map(processDomainCertStatus);
      } else{
        console.log('🌐 Calling backend SSL recheck API');
        const response = await sslApi.recheckAll();
        console.log('✅ SSL recheck completed:', response.message);
        sslData = response.ssl_status.map(processSslStatusItem);
      }

      setDomainSslData(sslData);

      // 更新缓存
      localStorage.setItem('cert-status-data', JSON.stringify({
        sslData,
        timestamp: new Date().toISOString(),
      }));
    } catch (error) {
      console.error('Failed to refresh certificates:', error);

      if (error instanceof ApiError) {
        console.error('API Error:', error.message, error.status);
      }

      // 如果API调用失败，回退到普通的获取逻辑
      console.warn('SSL recheck API failed, falling back to normal fetch');
      await fetchCertificates();
    } finally {
      setSslLoading(false);
    }
  };

  const fetchWhoisData = useCallback(async () => {
    setWhoisLoading(true);

    try {
      let whoisData: DomainWhoisStatus[];

      if (USE_NEW_API_FORMAT) {
        console.log('🌐 Fetching WHOIS status from NEW API format (/status/whois)');
        const response = await whoisApi.getStatusNew();
        whoisData = response.data.map(processWhoisDomainStatusNew);
      } else {
        console.log('🌐 Fetching whois status from legacy API format');
        const data = await whoisApi.getStatus();
        whoisData = data.whois_status.map(processWhoisStatusItem);
      }

      setDomainWhoisData(whoisData);

      // Cache the whois data separately
      localStorage.setItem('whois-status-data', JSON.stringify({
        whoisData,
        timestamp: new Date().toISOString(),
      }));

    } catch (error) {
      console.error('Failed to fetch whois data:', error);

      if (error instanceof ApiError) {
        console.error('Whois API Error:', error.message, error.status);
      }

      // Set empty array on API failure
      setDomainWhoisData([]);
    } finally {
      setWhoisLoading(false);
    }
  }, [USE_NEW_API_FORMAT]);

  const handleWhoisRefresh = async () => {
    setWhoisLoading(true);

    try {
      let whoisData: DomainWhoisStatus[];

      if (USE_NEW_API_FORMAT) {
        console.log('🔄 Refreshing WHOIS status with cache refresh (/status/whois?refresh_cache=true)');
        const response = await whoisApi.getStatusNew(true); // Pass true to refresh cache
        whoisData = response.data.map(processWhoisDomainStatusNew);
      } else {
        console.log('🔄 Refreshing WHOIS status from legacy API');
        const data = await whoisApi.getStatus();
        whoisData = data.whois_status.map(processWhoisStatusItem);
      }

      setDomainWhoisData(whoisData);

      // 更新缓存
      localStorage.setItem('whois-status-data', JSON.stringify({
        whoisData,
        timestamp: new Date().toISOString(),
      }));
    } catch (error) {
      console.error('Failed to refresh whois data:', error);

      if (error instanceof ApiError) {
        console.error('Whois API Error:', error.message, error.status);
      }

      // 如果刷新失败，回退到普通获取
      console.warn('WHOIS refresh failed, falling back to normal fetch');
      await fetchWhoisData();
    } finally {
      setWhoisLoading(false);
    }
  };

  useEffect(() => {
    
    // Check for cached data first
    const cachedData = localStorage.getItem('cert-status-data');
    if (cachedData) {
      try {
        const { sslData, timestamp } = JSON.parse(cachedData);
        const cacheAge = Date.now() - new Date(timestamp).getTime();
        
        if (cacheAge < config.app.cacheTimeout) {
          if (sslData) setDomainSslData(sslData);
          setSslLoading(false);
          // Don't return here - continue to process whois data
        } else {
          // Fetch fresh SSL data if cache is expired
          fetchCertificates();
        }
      } catch (error) {
        console.error('Failed to parse cached data:', error);
        // Fetch fresh SSL data if cache parsing fails
        fetchCertificates();
      }
    } else {
      // Fetch fresh SSL data if no cache exists
      fetchCertificates();
    }
    
    // Check for cached whois data
    const cachedWhoisData = localStorage.getItem('whois-status-data');
    if (cachedWhoisData) {
      try {
        const { whoisData, timestamp } = JSON.parse(cachedWhoisData);
        const cacheAge = Date.now() - new Date(timestamp).getTime();
        
        if (cacheAge < config.app.cacheTimeout) {
          // Always set whoisData, even if it's empty array
          setDomainWhoisData(whoisData || []);
          setWhoisLoading(false);
        } else {
          fetchWhoisData();
        }
      } catch (error) {
        console.error('Failed to parse cached whois data:', error);
        // Remove corrupted cache and fetch fresh data
        localStorage.removeItem('whois-status-data');
        fetchWhoisData();
      }
    } else {
      fetchWhoisData();
    }
  }, [fetchCertificates, fetchWhoisData]);

  return (
    <div className="container mx-auto px-4 py-6 max-w-7xl">
      <div className="mb-8">
        <div className="flex justify-between items-start">
          <div>
            <h1 className="text-3xl font-bold mb-2">{config.app.name}</h1>
          </div>
          
          {/* Removed view mode switcher buttons - only using domain table view */}
        </div>
      </div>
      
      <div className="space-y-6">
        <DomainSslTable 
          domains={domainSslData}
          loading={sslLoading}
          onRefresh={handleSslRefresh}
        />
        
        <WhoisStatusTable 
          domains={domainWhoisData}
          loading={whoisLoading}
          onRefresh={handleWhoisRefresh}
        />
      </div>
    </div>
  );
}